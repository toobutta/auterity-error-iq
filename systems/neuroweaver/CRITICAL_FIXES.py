#!/usr/bin/env python3
"""
Critical Security and Performance Fixes for NeuroWeaver Training Pipeline
Addresses the most severe issues identified in code review
"""

import os
import re
from pathlib import Path


def apply_critical_fixes():
    """Apply critical security and performance fixes"""

    training_file = Path("backend/app/services/training_pipeline.py")

    if not training_file.exists():
        return

    # Read current content
    content = training_file.read_text()

    # Fix 1: Path traversal vulnerability - validate paths
    path_validation = '''
def _validate_path(self, path: str, base_dir: str) -> str:
    """Validate and sanitize file paths to prevent traversal attacks"""
    import os.path
    # Resolve path and ensure it's within base directory
    resolved_path = os.path.abspath(os.path.join(base_dir, os.path.basename(path)))
    if not resolved_path.startswith(os.path.abspath(base_dir)):
        raise ValueError(f"Invalid path: {path}")
    return resolved_path
'''

    # Fix 2: Log injection - sanitize log inputs
    log_sanitizer = '''
def _sanitize_log_input(self, text: str) -> str:
    """Sanitize input for logging to prevent injection"""
    if not isinstance(text, str):
        text = str(text)
    # Remove newlines and control characters
    return re.sub(r'[\\r\\n\\t\\x00-\\x1f\\x7f-\\x9f]', '', text)
'''

    # Fix 3: Async training execution
    async_fix = '''
    async def _execute_training_async(self, trainer, job_id: str) -> Dict[str, Any]:
        """Execute training process asynchronously"""
        logger.info(f"Starting training execution for job {self._sanitize_log_input(job_id)}")

        start_time = datetime.utcnow()

        # Run blocking operations in executor
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
'''

    # Fix 4: Error handling improvements
    error_handling = '''
    async def _prepare_dataset_safe(self) -> Dataset:
        """Prepare training dataset with proper error handling"""
        logger.info("Preparing training dataset")

        try:
            # Validate dataset path
            dataset_path = self._validate_path(self.config.dataset_path, settings.DATA_DIR)

            if dataset_path.endswith('.jsonl'):
                data = []
                with open(dataset_path, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        try:
                            data.append(json.loads(line))
                        except json.JSONDecodeError as e:
                            logger.warning(f"Skipping invalid JSON at line {line_num}: {e}")
                            continue

                if not data:
                    raise ValueError("No valid data found in dataset")

                dataset = Dataset.from_list(data)

            elif dataset_path.endswith('.csv'):
                dataset = load_dataset('csv', data_files=dataset_path)['train']
            else:
                raise ValueError(f"Unsupported dataset format: {dataset_path}")

            # Apply preprocessing with error handling
            try:
                dataset = dataset.map(self._preprocess_function, batched=True)
            except Exception as e:
                logger.error(f"Dataset preprocessing failed: {e}")
                raise

            return dataset

        except (FileNotFoundError, PermissionError) as e:
            logger.error(f"Dataset file access error: {e}")
            raise
        except Exception as e:
            logger.error(f"Dataset preparation failed: {e}")
            raise
'''

    # Apply fixes by inserting them into the class
    fixes = [
        (path_validation, "class QLoRATrainer:"),
        (log_sanitizer, path_validation),
        (async_fix, log_sanitizer),
        (error_handling, async_fix),
    ]

    # Insert fixes
    for fix_code, after_marker in fixes:
        if after_marker in content and fix_code not in content:
            content = content.replace(after_marker, after_marker + fix_code)

    # Replace vulnerable method calls
    replacements = [
        # Fix path traversal in _save_model
        (
            'os.path.join(self.config.output_dir, "final_model")',
            'self._validate_path("final_model", self.config.output_dir)',
        ),
        # Fix log injection in multiple places
        (
            'logger.info(f"Starting QLoRA training for job {job_id}")',
            'logger.info(f"Starting QLoRA training for job {self._sanitize_log_input(job_id)}")',
        ),
        # Replace blocking training call
        (
            "training_result = await self._execute_training(trainer, job_id)",
            "training_result = await self._execute_training_async(trainer, job_id)",
        ),
        # Replace dataset preparation
        (
            "dataset = await self._prepare_dataset()",
            "dataset = await self._prepare_dataset_safe()",
        ),
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    # Write fixed content
    training_file.write_text(content)


if __name__ == "__main__":
    apply_critical_fixes()
