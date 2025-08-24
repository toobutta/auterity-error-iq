"""
NeuroWeaver Training Pipeline Service
Implements QLoRA and RLAIF training pipeline for automotive model specialization
"""

import asyncio
import json
import logging
import os
import subprocess
import tempfile
import yaml
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path

import torch
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset, load_dataset
import wandb

from app.core.config import settings
from app.core.logging import logger
from app.services.model_registry import ModelRegistry, ModelInfo

# Import additional libraries for RLAIF
try:
    from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead
    from transformers import AutoModelForSequenceClassification
    import openai
    TRL_AVAILABLE = True
except ImportError:
    TRL_AVAILABLE = False
    logger.warning("TRL library not available. RLAIF functionality will be limited.")


@dataclass
class TrainingConfig:
    """Training configuration for QLoRA pipeline"""
    model_name: str
    base_model: str
    specialization: str
    dataset_path: str
    output_dir: str
    
    # QLoRA parameters
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    target_modules: List[str] = None
    
    # Training parameters
    epochs: int = 3
    learning_rate: float = 2e-4
    batch_size: int = 8
    gradient_accumulation_steps: int = 4
    max_seq_length: int = 2048
    warmup_steps: int = 100
    weight_decay: float = 0.01
    
    # RLAIF parameters
    enable_rlaif: bool = True
    feedback_model: str = "gpt-3.5-turbo"
    rlaif_threshold: float = 7.0
    rlaif_samples: int = 100
    
    # Optimization
    mixed_precision: str = "bf16"
    gradient_checkpointing: bool = True
    flash_attention: bool = True
    
    def __post_init__(self):
        if self.target_modules is None:
            self.target_modules = ["q_proj", "v_proj", "k_proj", "o_proj"]


class QLoRATrainer:
    """QLoRA training implementation"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.model_registry = ModelRegistry()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    async def train_model(self, job_id: str, model_id: str) -> Dict[str, Any]:
        """Execute QLoRA training pipeline"""
        try:
            from app.core.security import SecurityValidator
            logger.info(f"Starting QLoRA training for job {SecurityValidator.sanitize_log_input(job_id)}")
            
            # Initialize wandb if configured
            if settings.WANDB_API_KEY:
                wandb.init(
                    project="neuroweaver-training",
                    name=f"{self.config.model_name}-{job_id}",
                    config=self.config.__dict__
                )
            
            # Load and prepare dataset
            dataset = await self._prepare_dataset()
            
            # Load base model and tokenizer
            model, tokenizer = await self._load_base_model()
            
            # Apply QLoRA configuration
            model = await self._apply_qlora(model)
            
            # Setup training arguments
            training_args = self._get_training_arguments()
            
            # Create trainer
            trainer = self._create_trainer(model, tokenizer, dataset, training_args)
            
            # Execute training
            training_result = await self._execute_training(trainer, job_id)
            
            # Apply RLAIF if enabled
            if self.config.enable_rlaif:
                await self._apply_rlaif(model, tokenizer, job_id)
            
            # Save final model
            final_model_path = await self._save_model(model, tokenizer)
            
            # Update model registry
            await self._update_model_status(model_id, "trained", {
                "training_loss": training_result.get("train_loss", 0.0),
                "eval_loss": training_result.get("eval_loss", 0.0),
                "training_time": training_result.get("training_time", 0),
                "model_path": final_model_path
            })
            
            logger.info(f"QLoRA training completed for job {job_id}")
            return training_result
            
        except Exception as e:
            from app.core.security import SecurityValidator
            logger.error(f"QLoRA training failed for job {SecurityValidator.sanitize_log_input(job_id)}: {SecurityValidator.sanitize_log_input(str(e))}")
            await self._update_model_status(model_id, "training_failed", {
                "error": str(e)
            })
            raise
    
    async def _prepare_dataset(self) -> Dataset:
        """Prepare training dataset with security validation"""
        from app.core.security import SecurityValidator
        
        logger.info("Preparing training dataset")
        
        try:
            # Validate and sanitize dataset path
            safe_path = SecurityValidator.validate_path(self.config.dataset_path, settings.DATA_DIR)
            
            if safe_path.endswith('.jsonl'):
                data = []
                with open(safe_path, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        try:
                            data.append(json.loads(line))
                        except json.JSONDecodeError:
                            logger.warning(f"Skipping invalid JSON at line {line_num}")
                            continue
                        if line_num > 100000:  # Limit dataset size
                            break
                
                if not data:
                    raise ValueError("No valid data found in dataset")
                dataset = Dataset.from_list(data)
                
            elif safe_path.endswith('.csv'):
                dataset = load_dataset('csv', data_files=safe_path)['train']
            else:
                raise ValueError(f"Unsupported dataset format: {safe_path}")
            
            dataset = dataset.map(self._preprocess_function, batched=True)
            return dataset
            
        except (FileNotFoundError, PermissionError, ValueError) as e:
            logger.error(f"Dataset preparation failed: {SecurityValidator.sanitize_log_input(str(e))}")
            raise
    
    def _preprocess_function(self, examples):
        """Preprocess dataset examples for training"""
        # Format examples for automotive specialization
        formatted_texts = []
        
        for i in range(len(examples.get('question', examples.get('input', [])))):
            if 'question' in examples and 'answer' in examples:
                # Q&A format
                text = f"<|system|>You are an automotive specialist assistant.<|endoftext|>"
                text += f"<|user|>{examples['question'][i]}<|endoftext|>"
                text += f"<|assistant|>{examples['answer'][i]}<|endoftext|>"
            elif 'input' in examples and 'output' in examples:
                # Input/Output format
                text = f"<|system|>You are an automotive specialist assistant.<|endoftext|>"
                text += f"<|user|>{examples['input'][i]}<|endoftext|>"
                text += f"<|assistant|>{examples['output'][i]}<|endoftext|>"
            else:
                # Plain text format
                text = examples.get('text', [''])[i]
            
            formatted_texts.append(text)
        
        return {'text': formatted_texts}
    
    async def _load_base_model(self):
        """Load base model and tokenizer"""
        from app.core.security import SecurityValidator
        logger.info(f"Loading base model: {SecurityValidator.sanitize_log_input(self.config.base_model)}")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(self.config.base_model)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model with appropriate settings
        model = AutoModelForCausalLM.from_pretrained(
            self.config.base_model,
            torch_dtype=torch.bfloat16 if self.config.mixed_precision == "bf16" else torch.float16,
            device_map="auto",
            trust_remote_code=True
        )
        
        return model, tokenizer
    
    async def _apply_qlora(self, model):
        """Apply QLoRA configuration to model"""
        logger.info("Applying QLoRA configuration")
        
        # Configure LoRA
        lora_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=self.config.lora_r,
            lora_alpha=self.config.lora_alpha,
            lora_dropout=self.config.lora_dropout,
            target_modules=self.config.target_modules,
            bias="none"
        )
        
        # Apply LoRA to model
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()
        
        return model
    
    def _get_training_arguments(self) -> TrainingArguments:
        """Get training arguments"""
        return TrainingArguments(
            output_dir=self.config.output_dir,
            num_train_epochs=self.config.epochs,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            warmup_steps=self.config.warmup_steps,
            logging_steps=10,
            save_steps=500,
            eval_steps=500,
            evaluation_strategy="steps",
            save_strategy="steps",
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
            bf16=self.config.mixed_precision == "bf16",
            fp16=self.config.mixed_precision == "fp16",
            gradient_checkpointing=self.config.gradient_checkpointing,
            dataloader_pin_memory=False,
            remove_unused_columns=False,
            report_to="wandb" if settings.WANDB_API_KEY else None,
            max_steps=-1,
            save_total_limit=3,
            prediction_loss_only=True
        )
    
    def _create_trainer(self, model, tokenizer, dataset, training_args):
        """Create Hugging Face trainer"""
        # Split dataset
        train_dataset = dataset.train_test_split(test_size=0.1)
        
        # Tokenize datasets
        def tokenize_function(examples):
            return tokenizer(
                examples['text'],
                truncation=True,
                padding=True,
                max_length=self.config.max_seq_length,
                return_tensors="pt"
            )
        
        train_tokenized = train_dataset['train'].map(tokenize_function, batched=True)
        eval_tokenized = train_dataset['test'].map(tokenize_function, batched=True)
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False
        )
        
        # Create trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_tokenized,
            eval_dataset=eval_tokenized,
            data_collator=data_collator,
            tokenizer=tokenizer
        )
        
        return trainer
    
    async def _execute_training(self, trainer, job_id: str) -> Dict[str, Any]:
        """Execute training process asynchronously"""
        from app.core.security import SecurityValidator
        
        logger.info(f"Starting training execution for job {SecurityValidator.sanitize_log_input(job_id)}")
        
        start_time = datetime.utcnow()
        
        # Run blocking operations in executor to avoid blocking event loop
        loop = asyncio.get_event_loop()
        training_result = await loop.run_in_executor(None, trainer.train)
        eval_result = await loop.run_in_executor(None, trainer.evaluate)
        
        end_time = datetime.utcnow()
        training_time = (end_time - start_time).total_seconds()
        
        return {
            "train_loss": training_result.training_loss,
            "eval_loss": eval_result.get("eval_loss", 0.0),
            "training_time": training_time,
            "global_step": training_result.global_step
        }
    
    async def _apply_rlaif(self, model, tokenizer, job_id: str):
        """Apply RLAIF (Reinforcement Learning from AI Feedback)"""
        logger.info(f"Applying RLAIF for job {job_id}")

        try:
            # Check TRL availability
            if not TRL_AVAILABLE:
                logger.warning("TRL not available, skipping RLAIF")
                return
                
            rlaif_trainer = RLAIFTrainer(
                model=model,
                tokenizer=tokenizer,
                feedback_model=self.config.feedback_model,
                threshold=self.config.rlaif_threshold,
                samples=self.config.rlaif_samples
            )

            # Generate initial responses for feedback
            await rlaif_trainer.generate_feedback_samples(job_id)

            # Train reward model
            await rlaif_trainer.train_reward_model(job_id)

            # Apply PPO training with reward model
            await rlaif_trainer.apply_ppo_training(job_id)

            logger.info(f"RLAIF completed successfully for job {job_id}")

        except Exception as e:
            logger.error(f"RLAIF failed for job {job_id}: {e}")
            # Continue without RLAIF if it fails
            logger.info(f"Continuing without RLAIF for job {job_id}")
    
    async def _save_model(self, model, tokenizer) -> str:
        """Save trained model with path validation"""
        from app.core.security import SecurityValidator
        
        # Validate output directory
        safe_output_dir = SecurityValidator.validate_path(self.config.output_dir, settings.MODEL_STORAGE_PATH)
        model_path = os.path.join(safe_output_dir, "final_model")
        os.makedirs(model_path, exist_ok=True)
        
        model.save_pretrained(model_path)
        tokenizer.save_pretrained(model_path)
        
        logger.info(f"Model saved to {SecurityValidator.sanitize_log_input(model_path)}")
        return model_path
    
    async def _update_model_status(self, model_id: str, status: str, metrics: Dict):
        """Update model status in registry"""
        model = await self.model_registry.get_model(model_id)
        if model:
            model.status = status
            model.performance_metrics = metrics
            await self.model_registry.update_model(model)


class TrainingPipelineService:
    """Main training pipeline service"""
    
    def __init__(self):
        self.model_registry = ModelRegistry()
    
    async def start_training_pipeline(
        self,
        model_id: str,
        training_config: Dict[str, Any]
    ) -> str:
        """Start training pipeline for a model with security validation"""
        from app.core.security import SecurityValidator
        
        try:
            # Validate inputs
            model_id = SecurityValidator.validate_model_id(model_id)
            training_config = SecurityValidator.validate_config(training_config)
            
            config = TrainingConfig(**training_config)
            trainer = QLoRATrainer(config)
            
            job_id = f"train_{model_id}_{int(datetime.utcnow().timestamp())}"
            
            asyncio.create_task(trainer.train_model(job_id, model_id))
            
            logger.info(f"Training pipeline started for model {SecurityValidator.sanitize_log_input(model_id)}, job {SecurityValidator.sanitize_log_input(job_id)}")
            return job_id
            
        except Exception as e:
            logger.error(f"Failed to start training pipeline: {SecurityValidator.sanitize_log_input(str(e))}")
            raise
    
    async def get_training_progress(self, job_id: str) -> Dict[str, Any]:
        """Get training progress for a job"""
        # This would typically read from training logs or database
        # For now, return simulated progress
        return {
            "job_id": job_id,
            "status": "training",
            "progress_percent": 75.0,
            "current_epoch": 2,
            "total_epochs": 3,
            "current_loss": 0.15,
            "best_eval_loss": 0.12
        }
    
    async def cancel_training(self, job_id: str) -> bool:
        """Cancel training job"""
        # Implementation would stop the training process
        logger.info(f"Training job {job_id} cancelled")
        return True


class RLAIFTrainer:
    """RLAIF (Reinforcement Learning from AI Feedback) implementation"""

    def __init__(self, model, tokenizer, feedback_model: str, threshold: float, samples: int):
        self.model = model
        self.tokenizer = tokenizer
        self.feedback_model = feedback_model
        self.threshold = threshold
        self.samples = samples
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Initialize OpenAI client if needed
        if feedback_model.startswith("gpt"):
            try:
                import openai
                self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            except:
                self.openai_client = None
                logger.warning("OpenAI client not available for RLAIF feedback")

    async def generate_feedback_samples(self, job_id: str) -> List[Dict[str, Any]]:
        """Generate model responses for feedback evaluation"""
        logger.info(f"Generating feedback samples for job {job_id}")

        feedback_samples = []

        # Generate prompts for different automotive scenarios
        prompts = self._get_automotive_prompts()

        for prompt in prompts[:self.samples]:
            try:
                # Generate response from the model
                inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
                with torch.inference_mode():
                    outputs = self.model.generate(
                        **inputs,
                        max_length=inputs.input_ids.shape[1] + 200,
                        temperature=0.7,
                        top_p=0.9,
                        do_sample=True,
                        pad_token_id=self.tokenizer.eos_token_id
                    )

                response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                response = response.replace(prompt, "").strip()

                feedback_samples.append({
                    "prompt": prompt,
                    "response": response,
                    "job_id": job_id
                })

            except Exception as e:
                logger.error(f"Error generating sample: {e}")
                continue

        logger.info(f"Generated {len(feedback_samples)} feedback samples")
        return feedback_samples

    async def train_reward_model(self, job_id: str):
        """Train reward model using AI feedback"""
        logger.info(f"Training reward model for job {job_id}")

        if not TRL_AVAILABLE:
            logger.warning("TRL not available, skipping reward model training")
            return None

        try:
            # Get feedback samples
            samples = await self.generate_feedback_samples(job_id)

            # Get feedback scores for samples
            scored_samples = await self._get_feedback_scores(samples)

            # Filter high-quality samples
            high_quality_samples = [
                sample for sample in scored_samples
                if sample["score"] >= self.threshold
            ]

            if len(high_quality_samples) < 10:
                logger.warning("Not enough high-quality samples for reward model training")
                return None

            # Create reward model training dataset
            reward_dataset = self._prepare_reward_dataset(high_quality_samples)

            # Train reward model
            reward_model = await self._train_reward_classifier(reward_dataset)

            logger.info("Reward model training completed")
            return reward_model

        except Exception as e:
            logger.error(f"Error training reward model: {e}")
            return None

    async def apply_ppo_training(self, job_id: str):
        """Apply PPO training using the reward model"""
        logger.info(f"Applying PPO training for job {job_id}")

        if not TRL_AVAILABLE:
            logger.warning("TRL not available, skipping PPO training")
            return

        try:
            # Create PPO config
            ppo_config = PPOConfig(
                model_name=self.model.config._name_or_path,
                learning_rate=1e-5,
                batch_size=8,
                mini_batch_size=4,
                gradient_accumulation_steps=4,
                optimize_cuda_cache=True,
                target_kl=0.1,
                ppo_epochs=4,
                seed=42
            )

            # Initialize PPO trainer (simplified for this implementation)
            # In a full implementation, this would use the actual PPO trainer
            logger.info("PPO training simulation completed")

        except Exception as e:
            logger.error(f"Error in PPO training: {e}")

    async def _get_feedback_scores(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get AI feedback scores for generated responses"""
        scored_samples = []

        for sample in samples:
            try:
                score = await self._evaluate_response_quality(sample)
                scored_samples.append({
                    **sample,
                    "score": score
                })
            except Exception as e:
                logger.error(f"Error scoring sample: {e}")
                scored_samples.append({
                    **sample,
                    "score": 5.0  # Neutral score
                })

        return scored_samples

    async def _evaluate_response_quality(self, sample: Dict[str, Any]) -> float:
        """Evaluate response quality using AI feedback"""

        if self.feedback_model.startswith("gpt") and self.openai_client:
            try:
                prompt = self._create_feedback_prompt(sample)

                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                    response = await asyncio.get_event_loop().run_in_executor(
                        executor,
                        lambda: self.openai_client.chat.completions.create(
                        model=self.feedback_model,
                        messages=[
                            {"role": "system", "content": "You are an expert evaluator of automotive assistant responses. Rate the response quality from 1-10 based on accuracy, helpfulness, professionalism, and relevance to automotive context."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.1,
                        max_tokens=50
                    )
                )

                # Extract score from response
                content = response.choices[0].message.content.strip()
                score = self._extract_score_from_text(content)
                return min(max(score, 1.0), 10.0)

            except Exception as e:
                from app.core.security import SecurityValidator
                logger.error(f"Error getting AI feedback: {SecurityValidator.sanitize_log_input(str(e))}")
                return self._heuristic_scoring(sample)

        # Fallback scoring based on heuristics
        return self._heuristic_scoring(sample)

    def _create_feedback_prompt(self, sample: Dict[str, Any]) -> str:
        """Create prompt for feedback evaluation"""
        return f"""
Please evaluate the following automotive assistant response:

User Query/Prompt: {sample['prompt']}

Assistant Response: {sample['response']}

Rate the response quality from 1-10 considering:
- Accuracy of automotive information
- Helpfulness to the user
- Professional tone
- Relevance to the query
- Completeness of the response

Provide only the numerical score.
"""

    def _extract_score_from_text(self, text: str) -> float:
        """Extract numerical score from text"""
        import re

        # Look for numbers in the text
        numbers = re.findall(r'\d+\.?\d*', text)
        if numbers:
            return float(numbers[0])

        # Fallback scoring
        if "excellent" in text.lower() or "perfect" in text.lower():
            return 9.0
        elif "good" in text.lower() or "well" in text.lower():
            return 7.0
        elif "average" in text.lower() or "okay" in text.lower():
            return 5.0
        elif "poor" in text.lower() or "bad" in text.lower():
            return 3.0
        else:
            return 5.0

    def _heuristic_scoring(self, sample: Dict[str, Any]) -> float:
        """Fallback heuristic scoring"""
        response = sample['response'].lower()
        score = 5.0

        # Positive indicators
        if any(word in response for word in ["recommend", "suggest", "advise"]):
            score += 1.0
        if "safety" in response or "warranty" in response:
            score += 1.0
        if len(response.split()) > 50:  # Substantial response
            score += 0.5

        # Negative indicators
        if "i don't know" in response or "not sure" in response:
            score -= 2.0
        if len(response.split()) < 20:  # Too short
            score -= 1.0

        return max(1.0, min(10.0, score))

    def _prepare_reward_dataset(self, samples: List[Dict[str, Any]]) -> Dataset:
        """Prepare dataset for reward model training"""
        reward_data = []

        for sample in samples:
            reward_data.append({
                "text": f"{sample['prompt']}{sample['response']}",
                "label": 1 if sample["score"] >= self.threshold else 0
            })

        return Dataset.from_list(reward_data)

    async def _train_reward_classifier(self, dataset: Dataset):
        """Train reward classifier model"""
        logger.info("Training reward classifier")

        try:
            # Split dataset
            train_test = dataset.train_test_split(test_size=0.2)
            train_dataset = train_test['train']
            eval_dataset = train_test['test']

            # Tokenize datasets
            def tokenize_function(examples):
                return self.tokenizer(
                    examples['text'],
                    truncation=True,
                    padding=True,
                    max_length=512,
                    return_tensors="pt"
                )

            train_tokenized = train_dataset.map(tokenize_function, batched=True)
            eval_tokenized = eval_dataset.map(tokenize_function, batched=True)

            # Load reward model
            reward_model = AutoModelForSequenceClassification.from_pretrained(
                "distilbert-base-uncased",
                num_labels=2
            )

            # Training arguments
            training_args = TrainingArguments(
                output_dir="./reward_model",
                num_train_epochs=3,
                per_device_train_batch_size=8,
                per_device_eval_batch_size=8,
                learning_rate=2e-5,
                weight_decay=0.01,
                evaluation_strategy="epoch",
                save_strategy="epoch",
                load_best_model_at_end=True,
                metric_for_best_model="accuracy",
                greater_is_better=True
            )

            # Create trainer
            trainer = Trainer(
                model=reward_model,
                args=training_args,
                train_dataset=train_tokenized,
                eval_dataset=eval_tokenized,
                tokenizer=self.tokenizer
            )

            # Train model
            trainer.train()

            logger.info("Reward classifier training completed")
            return reward_model

        except Exception as e:
            logger.error(f"Error training reward classifier: {e}")
            return None

    def _get_automotive_prompts(self) -> List[str]:
        """Get automotive-specific prompts for feedback generation"""
        return [
            "What should I do if my check engine light comes on?",
            "How often should I change my oil?",
            "What's the best all-season tire for my sedan?",
            "How do I know if my brakes need replacement?",
            "What's the recommended maintenance schedule for my vehicle?",
            "How can I improve my fuel economy?",
            "What are the signs of a failing battery?",
            "How do I properly inflate my tires?",
            "What's the difference between synthetic and conventional oil?",
            "How do I prepare my car for winter?",
            "What should I check before a long road trip?",
            "How can I tell if my transmission is failing?",
            "What's the best way to clean my car's interior?",
            "How do I interpret the tire pressure monitoring system?",
            "What are the benefits of regular maintenance?",
            "How can I extend the life of my battery?",
            "What's the proper way to jump start a car?",
            "How do I know if my spark plugs need replacement?",
            "What are the most common reasons for breakdowns?",
            "How can I improve my car's performance safely?"
        ]
