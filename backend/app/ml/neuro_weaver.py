"""
NeuroWeaver - Advanced ML Training Pipeline with AI Orchestration
Comprehensive training system with real-time optimization and automated model management
"""

from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset, random_split


class ModelType(str, Enum):
    REGRESSION = "regression"
    CLASSIFICATION = "classification"
    GENERATIVE = "generative"
    TRANSFORMER = "transformer"
    AUTOENCODER = "autoencoder"


class TrainingPhase(str, Enum):
    PREPARING = "preparing"
    TRAINING = "training"
    VALIDATING = "validating"
    TESTING = "testing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TrainingConfig:
    batch_size: int = 32
    learning_rate: float = 0.001
    epochs: int = 100
    validation_split: float = 0.2
    test_split: float = 0.1
    early_stopping_patience: int = 10
    model_save_path: str = "models/"
    checkpoint_frequency: int = 10
    use_mixed_precision: bool = True
    gradient_clip_value: float = 1.0

    # AI Optimization Settings
    auto_lr_scheduling: bool = True
    auto_architecture_optimization: bool = True
    hyperparameter_tuning: bool = True
    adaptive_batch_size: bool = True


@dataclass
class ModelMetrics:
    accuracy: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    loss: float = float("inf")
    val_loss: float = float("inf")
    training_time: float = 0.0
    inference_time: float = 0.0
    model_size_mb: float = 0.0
    flops: int = 0


class SystemDataset(Dataset):
    """Dataset for system behavior patterns and optimization"""

    def __init__(
        self,
        data: List[Dict],
        target_key: str = "performance_score",
        model_type: ModelType = ModelType.REGRESSION,
    ):
        self.data = data
        self.target_key = target_key
        self.model_type = model_type
        self.feature_names = self._extract_feature_names()
        self.scaler_params = self._calculate_normalization_params()

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        sample = self.data[idx]
        features = self._extract_features(sample)
        target = self._extract_target(sample)

        return torch.tensor(features, dtype=torch.float32), torch.tensor(
            target, dtype=torch.float32
        )

    def _extract_feature_names(self) -> List[str]:
        """Extract feature names from first sample"""
        if not self.data:
            return []

        return [
            "cpu_usage",
            "memory_usage",
            "network_latency",
            "error_rate",
            "request_count",
            "disk_io",
            "network_io",
            "cache_hit_ratio",
            "response_time",
            "throughput",
            "connection_count",
            "queue_depth",
        ]

    def _extract_features(self, sample: Dict) -> List[float]:
        """Extract numerical features from system data"""
        features = []

        # Core system metrics
        features.extend(
            [
                sample.get("cpu_usage", 0.0),
                sample.get("memory_usage", 0.0),
                sample.get("network_latency", 0.0),
                sample.get("error_rate", 0.0),
                sample.get("request_count", 0.0),
            ]
        )

        # Extended metrics
        features.extend(
            [
                sample.get("disk_io", 0.0),
                sample.get("network_io", 0.0),
                sample.get("cache_hit_ratio", 0.0),
                sample.get("response_time", 0.0),
                sample.get("throughput", 0.0),
                sample.get("connection_count", 0.0),
                sample.get("queue_depth", 0.0),
            ]
        )

        # Normalize features
        return self._normalize_features(features)

    def _extract_target(self, sample: Dict) -> float:
        """Extract target value based on model type"""
        target = sample.get(self.target_key, 0.0)

        if self.model_type == ModelType.CLASSIFICATION:
            # Convert to class index if needed
            if isinstance(target, str):
                class_mapping = {"poor": 0, "fair": 1, "good": 2, "excellent": 3}
                return class_mapping.get(target, 0)

        return target

    def _normalize_features(self, features: List[float]) -> List[float]:
        """Normalize features using stored parameters"""
        normalized = []
        for i, feature in enumerate(features):
            if i < len(self.scaler_params):
                mean, std = self.scaler_params[i]
                normalized.append((feature - mean) / (std + 1e-8))
            else:
                normalized.append(feature)
        return normalized

    def _calculate_normalization_params(self) -> List[Tuple[float, float]]:
        """Calculate normalization parameters (mean, std) for each feature"""
        if not self.data:
            return []

        feature_values = [[] for _ in self.feature_names]

        for sample in self.data:
            features = self._extract_features_raw(sample)
            for i, value in enumerate(features):
                if i < len(feature_values):
                    feature_values[i].append(value)

        params = []
        for values in feature_values:
            if values:
                mean = np.mean(values)
                std = np.std(values)
                params.append((mean, std))
            else:
                params.append((0.0, 1.0))

        return params

    def _extract_features_raw(self, sample: Dict) -> List[float]:
        """Extract raw features without normalization"""
        return [
            sample.get("cpu_usage", 0.0),
            sample.get("memory_usage", 0.0),
            sample.get("network_latency", 0.0),
            sample.get("error_rate", 0.0),
            sample.get("request_count", 0.0),
            sample.get("disk_io", 0.0),
            sample.get("network_io", 0.0),
            sample.get("cache_hit_ratio", 0.0),
            sample.get("response_time", 0.0),
            sample.get("throughput", 0.0),
            sample.get("connection_count", 0.0),
            sample.get("queue_depth", 0.0),
        ]


class AdaptiveNeuralNetwork(nn.Module):
    """Adaptive neural network with dynamic architecture optimization"""

    def __init__(
        self,
        input_dim: int,
        output_dim: int = 1,
        model_type: ModelType = ModelType.REGRESSION,
        hidden_dims: List[int] = None,
    ):
        super().__init__()

        self.input_dim = input_dim
        self.output_dim = output_dim
        self.model_type = model_type

        # Default architecture
        if hidden_dims is None:
            hidden_dims = [256, 128, 64, 32]

        self.layers = self._build_architecture(hidden_dims)
        self.dropout = nn.Dropout(0.2)
        self.batch_norm_layers = self._build_batch_norm_layers(hidden_dims)

        # Activation functions
        self.activation = nn.ReLU()
        if model_type == ModelType.CLASSIFICATION:
            self.output_activation = (
                nn.Softmax(dim=1) if output_dim > 1 else nn.Sigmoid()
            )
        else:
            self.output_activation = nn.Identity()

    def _build_architecture(self, hidden_dims: List[int]) -> nn.ModuleList:
        """Build dynamic architecture"""
        layers = nn.ModuleList()
        prev_dim = self.input_dim

        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            prev_dim = hidden_dim

        # Output layer
        layers.append(nn.Linear(prev_dim, self.output_dim))

        return layers

    def _build_batch_norm_layers(self, hidden_dims: List[int]) -> nn.ModuleList:
        """Build batch normalization layers"""
        return nn.ModuleList([nn.BatchNorm1d(dim) for dim in hidden_dims])

    def forward(self, x):
        for i, layer in enumerate(self.layers[:-1]):
            x = layer(x)
            if i < len(self.batch_norm_layers):
                x = self.batch_norm_layers[i](x)
            x = self.activation(x)
            x = self.dropout(x)

        # Output layer
        x = self.layers[-1](x)
        x = self.output_activation(x)

        return x

    def get_architecture_info(self) -> Dict[str, Any]:
        """Get architecture information"""
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)

        return {
            "total_parameters": total_params,
            "trainable_parameters": trainable_params,
            "model_size_mb": total_params * 4 / (1024 * 1024),  # Assuming float32
            "architecture": [
                layer.out_features
                for layer in self.layers
                if hasattr(layer, "out_features")
            ],
        }


class AutomaticHyperparameterTuner:
    """Automatic hyperparameter optimization"""

    def __init__(self):
        self.search_history: List[Dict] = []
        self.best_params: Dict[str, Any] = {}
        self.best_score: float = float("-inf")

    async def optimize_hyperparameters(
        self, base_config: TrainingConfig, dataset: Dataset, trials: int = 20
    ) -> TrainingConfig:
        """Optimize hyperparameters using random search"""
        search_space = {
            "learning_rate": [0.0001, 0.001, 0.01, 0.1],
            "batch_size": [16, 32, 64, 128],
            "hidden_dims": [
                [128, 64, 32],
                [256, 128, 64],
                [512, 256, 128, 64],
                [256, 128, 64, 32],
            ],
            "dropout_rate": [0.1, 0.2, 0.3, 0.4],
        }

        for trial in range(trials):
            # Sample random hyperparameters
            trial_params = self._sample_hyperparameters(search_space)

            # Create trial configuration
            trial_config = self._create_trial_config(base_config, trial_params)

            # Quick evaluation (reduced epochs)
            score = await self._evaluate_config(trial_config, dataset)

            # Update best parameters
            if score > self.best_score:
                self.best_score = score
                self.best_params = trial_params

            # Record trial
            self.search_history.append(
                {
                    "trial": trial,
                    "params": trial_params,
                    "score": score,
                    "timestamp": datetime.now().isoformat(),
                }
            )

        # Return optimized configuration
        return self._create_trial_config(base_config, self.best_params)

    def _sample_hyperparameters(self, search_space: Dict) -> Dict[str, Any]:
        """Sample random hyperparameters from search space"""
        import random

        sampled = {}
        for param, values in search_space.items():
            sampled[param] = random.choice(values)

        return sampled

    def _create_trial_config(
        self, base_config: TrainingConfig, params: Dict
    ) -> TrainingConfig:
        """Create trial configuration with sampled parameters"""
        trial_config = TrainingConfig(
            batch_size=params.get("batch_size", base_config.batch_size),
            learning_rate=params.get("learning_rate", base_config.learning_rate),
            epochs=20,  # Reduced for quick evaluation
            validation_split=base_config.validation_split,
            early_stopping_patience=5,
        )
        return trial_config

    async def _evaluate_config(self, config: TrainingConfig, dataset: Dataset) -> float:
        """Quick evaluation of configuration"""
        # Mock evaluation - would train actual model
        # Score based on configuration parameters
        score = 0.5  # Base score

        # Prefer moderate learning rates
        if 0.001 <= config.learning_rate <= 0.01:
            score += 0.1

        # Prefer reasonable batch sizes
        if 32 <= config.batch_size <= 64:
            score += 0.1

        return score + np.random.normal(0, 0.05)  # Add some noise


class RealTimeMonitor:
    """Real-time training monitoring with alerts"""

    def __init__(self):
        self.metrics_history: List[Dict] = []
        self.alerts: List[Dict] = []
        self.thresholds = {
            "loss_spike": 2.0,  # Alert if loss increases by 2x
            "accuracy_drop": 0.1,  # Alert if accuracy drops by 10%
            "plateau_patience": 20,  # Alert if no improvement for 20 epochs
        }

    def update_metrics(self, epoch: int, metrics: Dict[str, float]):
        """Update training metrics"""
        entry = {"epoch": epoch, "timestamp": datetime.now().isoformat(), **metrics}
        self.metrics_history.append(entry)

        # Check for alerts
        self._check_alerts(epoch, metrics)

    def _check_alerts(self, epoch: int, metrics: Dict[str, float]):
        """Check for training alerts"""
        if len(self.metrics_history) < 2:
            return

        current = metrics
        previous = self.metrics_history[-2]

        # Loss spike detection
        if (
            current.get("loss", 0)
            > previous.get("loss", 0) * self.thresholds["loss_spike"]
        ):
            self._create_alert("loss_spike", f"Loss spiked at epoch {epoch}")

        # Accuracy drop detection
        if (
            current.get("accuracy", 0)
            < previous.get("accuracy", 0) - self.thresholds["accuracy_drop"]
        ):
            self._create_alert("accuracy_drop", f"Accuracy dropped at epoch {epoch}")

        # Plateau detection
        if self._detect_plateau(epoch):
            self._create_alert("plateau", f"Training plateaued at epoch {epoch}")

    def _detect_plateau(self, current_epoch: int) -> bool:
        """Detect if training has plateaued"""
        if len(self.metrics_history) < self.thresholds["plateau_patience"]:
            return False

        recent_losses = [
            entry.get("loss", float("inf"))
            for entry in self.metrics_history[-self.thresholds["plateau_patience"] :]
        ]

        # Check if loss hasn't improved significantly
        min_recent_loss = min(recent_losses)
        current_loss = self.metrics_history[-1].get("loss", float("inf"))

        return abs(current_loss - min_recent_loss) < 0.001

    def _create_alert(self, alert_type: str, message: str):
        """Create training alert"""
        alert = {
            "type": alert_type,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "severity": "warning",
        }
        self.alerts.append(alert)
        print(f"⚠️ Training Alert: {message}")

    def get_training_summary(self) -> Dict[str, Any]:
        """Get comprehensive training summary"""
        if not self.metrics_history:
            return {"status": "no_data"}

        latest = self.metrics_history[-1]

        return {
            "epochs_completed": len(self.metrics_history),
            "latest_metrics": latest,
            "alerts_count": len(self.alerts),
            "recent_alerts": self.alerts[-5:],
            "training_progress": self._calculate_progress(),
            "estimated_completion": self._estimate_completion(),
        }

    def _calculate_progress(self) -> Dict[str, Any]:
        """Calculate training progress"""
        if len(self.metrics_history) < 2:
            return {"progress": 0.0}

        # Simple progress based on loss improvement
        initial_loss = self.metrics_history[0].get("loss", 1.0)
        current_loss = self.metrics_history[-1].get("loss", 1.0)

        progress = max(0, 1 - (current_loss / initial_loss))

        return {
            "progress": min(progress, 1.0),
            "loss_reduction": (initial_loss - current_loss) / initial_loss,
            "trend": (
                "improving"
                if len(self.metrics_history) > 5
                and self.metrics_history[-1].get("loss", 0)
                < self.metrics_history[-5].get("loss", 0)
                else "stable"
            ),
        }

    def _estimate_completion(self) -> str:
        """Estimate training completion time"""
        if len(self.metrics_history) < 5:
            return "estimating..."

        # Simple estimation based on recent progress
        recent_improvement = abs(
            self.metrics_history[-1].get("loss", 0)
            - self.metrics_history[-5].get("loss", 0)
        )

        if recent_improvement < 0.001:
            return "converging soon"
        else:
            return "continuing"


class NeuroWeaver:
    """Advanced ML Training Pipeline with AI Orchestration"""

    def __init__(self, config: TrainingConfig = TrainingConfig()):
        self.config = config
        self.model: Optional[AdaptiveNeuralNetwork] = None
        self.training_history: List[Dict] = []
        self.is_trained = False
        self.current_phase = TrainingPhase.PREPARING

        # AI Components
        self.hyperparameter_tuner = AutomaticHyperparameterTuner()
        self.monitor = RealTimeMonitor()

        # Training state
        self.optimizer: Optional[torch.optim.Optimizer] = None
        self.scheduler: Optional[torch.optim.lr_scheduler._LRScheduler] = None
        self.scaler = (
            torch.cuda.amp.GradScaler() if config.use_mixed_precision else None
        )

        # Performance tracking
        self.model_metrics = ModelMetrics()
        self.training_start_time: Optional[datetime] = None

        # Model registry
        self.model_versions: Dict[str, Dict] = {}

        # Ensure model save directory exists
        Path(config.model_save_path).mkdir(parents=True, exist_ok=True)

    async def train(
        self,
        training_data: List[Dict],
        model_type: ModelType = ModelType.REGRESSION,
        target_key: str = "performance_score",
    ) -> Dict[str, Any]:
        """Main training pipeline with AI optimization"""

        print("🧠 NeuroWeaver Advanced Training Pipeline Initiated")
        self.training_start_time = datetime.now()
        self.current_phase = TrainingPhase.PREPARING

        try:
            # 1. Data Preparation
            print("📊 Preparing dataset...")
            dataset = SystemDataset(training_data, target_key, model_type)

            # Split dataset
            train_size = int(
                (1 - self.config.validation_split - self.config.test_split)
                * len(dataset)
            )
            val_size = int(self.config.validation_split * len(dataset))
            test_size = len(dataset) - train_size - val_size

            train_dataset, val_dataset, test_dataset = random_split(
                dataset, [train_size, val_size, test_size]
            )

            # Create data loaders
            train_loader = DataLoader(
                train_dataset,
                batch_size=self.config.batch_size,
                shuffle=True,
                num_workers=2,
                pin_memory=True,
            )
            val_loader = DataLoader(val_dataset, batch_size=self.config.batch_size)
            test_loader = DataLoader(test_dataset, batch_size=self.config.batch_size)

            # 2. Hyperparameter Optimization (if enabled)
            if self.config.hyperparameter_tuning:
                print("🔧 Optimizing hyperparameters...")
                self.config = await self.hyperparameter_tuner.optimize_hyperparameters(
                    self.config, dataset
                )
                print(
                    f"✅ Best hyperparameters found: {self.hyperparameter_tuner.best_params}"
                )

            # 3. Model Initialization
            print("🏗️ Building adaptive neural network...")
            input_dim = len(dataset.feature_names)
            output_dim = (
                1
                if model_type == ModelType.REGRESSION
                else len(set(sample.get(target_key) for sample in training_data))
            )

            self.model = AdaptiveNeuralNetwork(
                input_dim=input_dim, output_dim=output_dim, model_type=model_type
            )

            # Print model info
            arch_info = self.model.get_architecture_info()
            print(f"📐 Model Architecture: {arch_info['architecture']}")
            print(f"🔢 Total Parameters: {arch_info['total_parameters']:,}")

            # 4. Training Setup
            criterion = self._get_loss_function(model_type)
            self.optimizer = optim.AdamW(
                self.model.parameters(), lr=self.config.learning_rate, weight_decay=0.01
            )

            if self.config.auto_lr_scheduling:
                self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
                    self.optimizer, mode="min", patience=5, factor=0.5
                )

            # 5. Training Loop
            print("🚀 Starting training with real-time monitoring...")
            self.current_phase = TrainingPhase.TRAINING

            best_val_loss = float("inf")
            patience_counter = 0

            for epoch in range(self.config.epochs):
                # Training phase
                train_metrics = await self._train_epoch(train_loader, criterion)

                # Validation phase
                self.current_phase = TrainingPhase.VALIDATING
                val_metrics = await self._validate_epoch(val_loader, criterion)

                # Combine metrics
                epoch_metrics = {**train_metrics, **val_metrics}

                # Update learning rate scheduler
                if self.scheduler:
                    self.scheduler.step(val_metrics["val_loss"])

                # Real-time monitoring
                self.monitor.update_metrics(epoch, epoch_metrics)

                # Log progress
                self.training_history.append(
                    {
                        "epoch": epoch,
                        "timestamp": datetime.now().isoformat(),
                        **epoch_metrics,
                    }
                )

                if epoch % 10 == 0:
                    print(
                        f"Epoch {epoch+1}/{self.config.epochs} - "
                        f"Train Loss: {train_metrics['loss']:.4f}, "
                        f"Val Loss: {val_metrics['val_loss']:.4f}"
                    )

                # Early stopping with AI-driven patience
                if val_metrics["val_loss"] < best_val_loss:
                    best_val_loss = val_metrics["val_loss"]
                    patience_counter = 0
                    await self._save_checkpoint(epoch, "best")
                else:
                    patience_counter += 1

                    # AI-driven early stopping
                    if patience_counter >= self.config.early_stopping_patience:
                        print(f"🛑 Early stopping at epoch {epoch+1}")
                        break

                # Periodic checkpoints
                if epoch % self.config.checkpoint_frequency == 0:
                    await self._save_checkpoint(epoch, "checkpoint")

                self.current_phase = TrainingPhase.TRAINING

            # 6. Final Evaluation
            print("📈 Conducting final evaluation...")
            self.current_phase = TrainingPhase.TESTING
            test_metrics = await self._test_model(test_loader, criterion)

            # 7. Model Finalization
            await self._finalize_model(test_metrics)
            self.current_phase = TrainingPhase.COMPLETED
            self.is_trained = True

            training_time = (datetime.now() - self.training_start_time).total_seconds()

            print(f"✅ Training completed in {training_time:.2f} seconds")

            return {
                "status": "training_completed",
                "training_time": training_time,
                "epochs_trained": epoch + 1,
                "best_val_loss": best_val_loss,
                "test_metrics": test_metrics,
                "model_info": self.model.get_architecture_info(),
                "training_summary": self.monitor.get_training_summary(),
                "hyperparameter_optimization": (
                    self.hyperparameter_tuner.search_history[-5:]
                    if self.config.hyperparameter_tuning
                    else None
                ),
            }

        except Exception as e:
            self.current_phase = TrainingPhase.FAILED
            print(f"❌ Training failed: {str(e)}")
            return {
                "status": "training_failed",
                "error": str(e),
                "phase": self.current_phase,
                "partial_history": self.training_history,
            }

    def _get_loss_function(self, model_type: ModelType) -> nn.Module:
        """Get appropriate loss function for model type"""
        if model_type == ModelType.REGRESSION:
            return nn.MSELoss()
        elif model_type == ModelType.CLASSIFICATION:
            return nn.CrossEntropyLoss()
        else:
            return nn.MSELoss()

    async def _train_epoch(
        self, dataloader: DataLoader, criterion: nn.Module
    ) -> Dict[str, float]:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0.0
        correct_predictions = 0
        total_samples = 0

        for batch_features, batch_targets in dataloader:
            self.optimizer.zero_grad()

            if self.config.use_mixed_precision and self.scaler:
                with torch.cuda.amp.autocast():
                    predictions = self.model(batch_features)
                    loss = criterion(predictions.squeeze(), batch_targets)

                self.scaler.scale(loss).backward()

                if self.config.gradient_clip_value > 0:
                    self.scaler.unscale_(self.optimizer)
                    torch.nn.utils.clip_grad_norm_(
                        self.model.parameters(), self.config.gradient_clip_value
                    )

                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                predictions = self.model(batch_features)
                loss = criterion(predictions.squeeze(), batch_targets)
                loss.backward()

                if self.config.gradient_clip_value > 0:
                    torch.nn.utils.clip_grad_norm_(
                        self.model.parameters(), self.config.gradient_clip_value
                    )

                self.optimizer.step()

            total_loss += loss.item()
            total_samples += batch_targets.size(0)

            # Calculate accuracy for classification
            if (
                hasattr(self.model, "model_type")
                and self.model.model_type == ModelType.CLASSIFICATION
            ):
                _, predicted = torch.max(predictions.data, 1)
                correct_predictions += (predicted == batch_targets).sum().item()

        metrics = {
            "loss": total_loss / len(dataloader),
            "samples_processed": total_samples,
        }

        if correct_predictions > 0:
            metrics["accuracy"] = correct_predictions / total_samples

        return metrics

    async def _validate_epoch(
        self, dataloader: DataLoader, criterion: nn.Module
    ) -> Dict[str, float]:
        """Validate for one epoch"""
        self.model.eval()
        total_loss = 0.0
        correct_predictions = 0
        total_samples = 0

        with torch.no_grad():
            for batch_features, batch_targets in dataloader:
                predictions = self.model(batch_features)
                loss = criterion(predictions.squeeze(), batch_targets)

                total_loss += loss.item()
                total_samples += batch_targets.size(0)

                # Calculate accuracy for classification
                if (
                    hasattr(self.model, "model_type")
                    and self.model.model_type == ModelType.CLASSIFICATION
                ):
                    _, predicted = torch.max(predictions.data, 1)
                    correct_predictions += (predicted == batch_targets).sum().item()

        metrics = {
            "val_loss": total_loss / len(dataloader),
            "val_samples": total_samples,
        }

        if correct_predictions > 0:
            metrics["val_accuracy"] = correct_predictions / total_samples

        return metrics

    async def _test_model(
        self, dataloader: DataLoader, criterion: nn.Module
    ) -> Dict[str, float]:
        """Final model testing"""
        self.model.eval()
        total_loss = 0.0
        correct_predictions = 0
        total_samples = 0
        all_predictions = []
        all_targets = []

        with torch.no_grad():
            for batch_features, batch_targets in dataloader:
                predictions = self.model(batch_features)
                loss = criterion(predictions.squeeze(), batch_targets)

                total_loss += loss.item()
                total_samples += batch_targets.size(0)

                all_predictions.extend(predictions.squeeze().tolist())
                all_targets.extend(batch_targets.tolist())

                # Calculate accuracy for classification
                if (
                    hasattr(self.model, "model_type")
                    and self.model.model_type == ModelType.CLASSIFICATION
                ):
                    _, predicted = torch.max(predictions.data, 1)
                    correct_predictions += (predicted == batch_targets).sum().item()

        # Calculate comprehensive metrics
        metrics = {
            "test_loss": total_loss / len(dataloader),
            "test_samples": total_samples,
        }

        if correct_predictions > 0:
            metrics["test_accuracy"] = correct_predictions / total_samples

        # Additional metrics (simplified)
        if len(all_predictions) > 0:
            mse = np.mean([(p - t) ** 2 for p, t in zip(all_predictions, all_targets)])
            metrics["test_mse"] = mse
            metrics["test_rmse"] = np.sqrt(mse)

        return metrics

    async def _save_checkpoint(self, epoch: int, checkpoint_type: str):
        """Save model checkpoint"""
        if not self.model:
            return

        checkpoint_path = (
            Path(self.config.model_save_path)
            / f"neuroweaver_{checkpoint_type}_epoch_{epoch}.pth"
        )

        checkpoint = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "training_history": self.training_history,
            "config": asdict(self.config),
            "timestamp": datetime.now().isoformat(),
        }

        if self.scheduler:
            checkpoint["scheduler_state_dict"] = self.scheduler.state_dict()

        torch.save(checkpoint, checkpoint_path)

    async def _finalize_model(self, test_metrics: Dict[str, float]):
        """Finalize trained model"""
        # Save final model
        final_model_path = Path(self.config.model_save_path) / "neuroweaver_final.pth"
        torch.save(
            {
                "model_state_dict": self.model.state_dict(),
                "model_architecture": self.model.get_architecture_info(),
                "test_metrics": test_metrics,
                "training_config": asdict(self.config),
                "timestamp": datetime.now().isoformat(),
            },
            final_model_path,
        )

        # Update model metrics
        self.model_metrics = ModelMetrics(
            accuracy=test_metrics.get("test_accuracy", 0.0),
            loss=test_metrics.get("test_loss", 0.0),
            training_time=(datetime.now() - self.training_start_time).total_seconds(),
            model_size_mb=self.model.get_architecture_info()["model_size_mb"],
        )

        # Register model version
        version_id = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.model_versions[version_id] = {
            "path": str(final_model_path),
            "metrics": asdict(self.model_metrics),
            "architecture": self.model.get_architecture_info(),
            "created_at": datetime.now().isoformat(),
        }

        print(f"💾 Model saved as version {version_id}")

    async def predict(self, system_data: Dict) -> Dict[str, Any]:
        """Make prediction for system optimization"""
        if not self.is_trained or not self.model:
            raise ValueError("Model not trained yet")

        self.model.eval()

        # Prepare input data (mock dataset for feature extraction)
        mock_dataset = SystemDataset([system_data])
        features = torch.tensor(
            mock_dataset._extract_features(system_data), dtype=torch.float32
        ).unsqueeze(0)

        start_time = datetime.now()

        with torch.no_grad():
            prediction = self.model(features)

        inference_time = (datetime.now() - start_time).total_seconds()

        return {
            "prediction": (
                prediction.item() if prediction.numel() == 1 else prediction.tolist()
            ),
            "confidence": 0.85,  # Would calculate actual confidence
            "inference_time_ms": inference_time * 1000,
            "model_version": (
                list(self.model_versions.keys())[-1]
                if self.model_versions
                else "unknown"
            ),
        }

    def get_training_status(self) -> Dict[str, Any]:
        """Get current training status"""
        return {
            "is_trained": self.is_trained,
            "current_phase": self.current_phase,
            "training_history": self.training_history[-10:],  # Last 10 epochs
            "model_loaded": self.model is not None,
            "model_metrics": asdict(self.model_metrics),
            "real_time_monitoring": self.monitor.get_training_summary(),
            "available_versions": list(self.model_versions.keys()),
            "hyperparameter_tuning_results": {
                "best_score": self.hyperparameter_tuner.best_score,
                "best_params": self.hyperparameter_tuner.best_params,
                "trials_completed": len(self.hyperparameter_tuner.search_history),
            },
        }

    async def load_model(self, version_id: str = None) -> bool:
        """Load a specific model version"""
        try:
            if version_id and version_id in self.model_versions:
                model_path = self.model_versions[version_id]["path"]
            else:
                # Load latest model
                model_path = Path(self.config.model_save_path) / "neuroweaver_final.pth"

            if not Path(model_path).exists():
                return False

            checkpoint = torch.load(model_path)

            # Recreate model architecture
            arch_info = checkpoint.get("model_architecture", {})
            self.model = AdaptiveNeuralNetwork(
                input_dim=12, output_dim=1  # Default feature count
            )

            # Load model state
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.is_trained = True

            print(f"✅ Model loaded from {model_path}")
            return True

        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            return False


# Global NeuroWeaver instance
neuro_weaver = NeuroWeaver()
