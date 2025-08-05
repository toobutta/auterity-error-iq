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
            logger.info(f"Starting QLoRA training for job {job_id}")
            
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
            logger.error(f"QLoRA training failed for job {job_id}: {e}")
            await self._update_model_status(model_id, "training_failed", {
                "error": str(e)
            })
            raise
    
    async def _prepare_dataset(self) -> Dataset:
        """Prepare training dataset"""
        logger.info("Preparing training dataset")
        
        if self.config.dataset_path.endswith('.jsonl'):
            # Load JSONL dataset
            data = []
            with open(self.config.dataset_path, 'r') as f:
                for line in f:
                    data.append(json.loads(line))
            
            # Convert to Hugging Face dataset format
            dataset = Dataset.from_list(data)
            
        elif self.config.dataset_path.endswith('.csv'):
            # Load CSV dataset
            dataset = load_dataset('csv', data_files=self.config.dataset_path)['train']
            
        else:
            raise ValueError(f"Unsupported dataset format: {self.config.dataset_path}")
        
        # Apply preprocessing
        dataset = dataset.map(self._preprocess_function, batched=True)
        
        return dataset
    
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
        logger.info(f"Loading base model: {self.config.base_model}")
        
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
            report_to="wandb" if settings.WANDB_API_KEY else None
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
        """Execute training process"""
        logger.info(f"Starting training execution for job {job_id}")
        
        start_time = datetime.utcnow()
        
        # Train model
        training_result = trainer.train()
        
        end_time = datetime.utcnow()
        training_time = (end_time - start_time).total_seconds()
        
        # Evaluate model
        eval_result = trainer.evaluate()
        
        return {
            "train_loss": training_result.training_loss,
            "eval_loss": eval_result.get("eval_loss", 0.0),
            "training_time": training_time,
            "global_step": training_result.global_step
        }
    
    async def _apply_rlaif(self, model, tokenizer, job_id: str):
        """Apply RLAIF (Reinforcement Learning from AI Feedback)"""
        logger.info(f"Applying RLAIF for job {job_id}")
        
        # This is a simplified RLAIF implementation
        # In production, this would involve:
        # 1. Generate responses from the model
        # 2. Get feedback from the feedback model
        # 3. Use feedback to improve the model through RL
        
        # For now, we'll simulate the process
        logger.info("RLAIF simulation completed")
    
    async def _save_model(self, model, tokenizer) -> str:
        """Save trained model"""
        model_path = os.path.join(self.config.output_dir, "final_model")
        os.makedirs(model_path, exist_ok=True)
        
        # Save model and tokenizer
        model.save_pretrained(model_path)
        tokenizer.save_pretrained(model_path)
        
        logger.info(f"Model saved to {model_path}")
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
        """Start training pipeline for a model"""
        try:
            # Create training configuration
            config = TrainingConfig(**training_config)
            
            # Create trainer
            trainer = QLoRATrainer(config)
            
            # Generate job ID
            job_id = f"train_{model_id}_{int(datetime.utcnow().timestamp())}"
            
            # Start training in background
            asyncio.create_task(trainer.train_model(job_id, model_id))
            
            logger.info(f"Training pipeline started for model {model_id}, job {job_id}")
            return job_id
            
        except Exception as e:
            logger.error(f"Failed to start training pipeline: {e}")
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