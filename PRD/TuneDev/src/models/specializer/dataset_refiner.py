"""
Smart Dataset Refinement Engine

This module implements automated detection and correction of issues in fine-tuning datasets
such as class imbalance, redundancy, and mislabeling.
"""

import os
import json
import yaml
import logging
from typing import List, Dict, Any, Optional, Union, Tuple, Set
import numpy as np
import pandas as pd
from collections import Counter
from dataclasses import dataclass
import hashlib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class DatasetStats:
    """Statistics about a dataset"""
    total_samples: int
    class_distribution: Dict[str, int]
    avg_input_length: float
    avg_output_length: float
    duplicates_count: int
    outliers_count: int
    noise_count: int


class SmartDatasetRefiner:
    """
    Smart Dataset Refinement Engine that automatically detects and fixes issues
    in fine-tuning datasets.
    """
    
    def __init__(self, config_path: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Dataset Refiner
        
        Args:
            config_path: Path to YAML configuration file
            config: Configuration dictionary (alternative to config_path)
        """
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        elif config:
            self.config = config
        else:
            self.config = {
                "input_field": "input",
                "output_field": "output",
                "class_field": "class",
                "min_samples_per_class": 50,
                "duplicate_threshold": 0.95,
                "outlier_threshold": 0.2,
                "noise_detection_confidence": 0.7,
                "max_synthetic_samples": 500,
                "vectorizer": "tfidf",
                "clustering_eps": 0.3,
                "clustering_min_samples": 5
            }
            
        # Initialize vectorizer for text similarity
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
    def analyze_dataset(self, dataset: List[Dict[str, Any]]) -> DatasetStats:
        """
        Analyze a dataset and return statistics
        
        Args:
            dataset: List of data samples
            
        Returns:
            DatasetStats: Statistics about the dataset
        """
        if not dataset:
            raise ValueError("Dataset is empty")
            
        # Extract fields
        input_field = self.config.get("input_field", "input")
        output_field = self.config.get("output_field", "output")
        class_field = self.config.get("class_field", "class")
        
        # Calculate class distribution
        class_distribution = Counter()
        if all(class_field in sample for sample in dataset):
            class_distribution.update([sample[class_field] for sample in dataset])
        
        # Calculate average lengths
        input_lengths = [len(str(sample.get(input_field, ""))) for sample in dataset]
        output_lengths = [len(str(sample.get(output_field, ""))) for sample in dataset]
        
        avg_input_length = sum(input_lengths) / len(input_lengths) if input_lengths else 0
        avg_output_length = sum(output_lengths) / len(output_lengths) if output_lengths else 0
        
        # Find duplicates
        duplicates = self._find_duplicates(dataset)
        
        # Find outliers
        outliers = self._find_outliers(dataset)
        
        # Find noise
        noise = self._find_noise(dataset)
        
        return DatasetStats(
            total_samples=len(dataset),
            class_distribution=dict(class_distribution),
            avg_input_length=avg_input_length,
            avg_output_length=avg_output_length,
            duplicates_count=len(duplicates),
            outliers_count=len(outliers),
            noise_count=len(noise)
        )
    
    def _find_duplicates(self, dataset: List[Dict[str, Any]]) -> List[int]:
        """
        Find duplicate samples in the dataset
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[int]: Indices of duplicate samples
        """
        input_field = self.config.get("input_field", "input")
        output_field = self.config.get("output_field", "output")
        
        # Create a hash for each sample
        hashes = {}
        duplicates = []
        
        for i, sample in enumerate(dataset):
            # Create a hash of input and output
            input_text = str(sample.get(input_field, ""))
            output_text = str(sample.get(output_field, ""))
            
            # Simple hash for exact duplicates
            sample_hash = hashlib.md5((input_text + output_text).encode()).hexdigest()
            
            if sample_hash in hashes:
                duplicates.append(i)
            else:
                hashes[sample_hash] = i
                
        # For near-duplicates, use vectorization and similarity
        if len(dataset) > 1 and len(duplicates) < len(dataset) - 1:
            try:
                # Vectorize inputs
                inputs = [str(sample.get(input_field, "")) for sample in dataset]
                vectors = self.vectorizer.fit_transform(inputs)
                
                # Calculate pairwise similarity
                similarity = cosine_similarity(vectors)
                
                # Find near-duplicates
                threshold = self.config.get("duplicate_threshold", 0.95)
                for i in range(len(dataset)):
                    if i in duplicates:
                        continue
                    
                    for j in range(i + 1, len(dataset)):
                        if j in duplicates:
                            continue
                            
                        if similarity[i, j] > threshold:
                            duplicates.append(j)
            except Exception as e:
                logger.warning(f"Error finding near-duplicates: {str(e)}")
                
        return sorted(list(set(duplicates)))
    
    def _find_outliers(self, dataset: List[Dict[str, Any]]) -> List[int]:
        """
        Find outlier samples in the dataset
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[int]: Indices of outlier samples
        """
        input_field = self.config.get("input_field", "input")
        
        # Use clustering to find outliers
        outliers = []
        
        try:
            # Vectorize inputs
            inputs = [str(sample.get(input_field, "")) for sample in dataset]
            vectors = self.vectorizer.fit_transform(inputs)
            
            # Use DBSCAN for outlier detection
            eps = self.config.get("clustering_eps", 0.3)
            min_samples = self.config.get("clustering_min_samples", 5)
            
            clustering = DBSCAN(eps=eps, min_samples=min_samples, metric='cosine').fit(vectors)
            
            # Samples with cluster label -1 are outliers
            outliers = [i for i, label in enumerate(clustering.labels_) if label == -1]
            
        except Exception as e:
            logger.warning(f"Error finding outliers: {str(e)}")
            
        return outliers
    
    def _find_noise(self, dataset: List[Dict[str, Any]]) -> List[int]:
        """
        Find noisy samples in the dataset (potentially mislabeled)
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[int]: Indices of noisy samples
        """
        input_field = self.config.get("input_field", "input")
        output_field = self.config.get("output_field", "output")
        class_field = self.config.get("class_field", "class")
        
        noise = []
        
        # Check if we have class labels
        if not all(class_field in sample for sample in dataset):
            return noise
            
        try:
            # Group by class
            classes = {}
            for i, sample in enumerate(dataset):
                class_label = sample.get(class_field)
                if class_label not in classes:
                    classes[class_label] = []
                classes[class_label].append((i, sample))
                
            # For each class, find samples that are more similar to other classes
            for class_label, samples in classes.items():
                if len(samples) < 2:
                    continue
                    
                # Get indices and samples for this class
                indices = [i for i, _ in samples]
                class_inputs = [str(sample.get(input_field, "")) for _, sample in samples]
                
                # Vectorize
                class_vectors = self.vectorizer.fit_transform(class_inputs)
                
                # Calculate average similarity within class
                class_similarity = cosine_similarity(class_vectors)
                avg_class_similarity = np.mean(class_similarity)
                
                # Check each sample against other classes
                for other_class, other_samples in classes.items():
                    if other_class == class_label or len(other_samples) < 2:
                        continue
                        
                    other_inputs = [str(sample.get(input_field, "")) for _, sample in other_samples]
                    other_vectors = self.vectorizer.transform(other_inputs)
                    
                    # For each sample in this class
                    for idx, (i, sample) in enumerate(samples):
                        # Calculate similarity to other class
                        sample_vector = class_vectors[idx]
                        cross_similarity = cosine_similarity(sample_vector, other_vectors)
                        avg_cross_similarity = np.mean(cross_similarity)
                        
                        # If more similar to other class, mark as noise
                        if avg_cross_similarity > avg_class_similarity:
                            noise.append(i)
                            
        except Exception as e:
            logger.warning(f"Error finding noise: {str(e)}")
            
        return sorted(list(set(noise)))
    
    def fix_class_imbalance(self, dataset: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Fix class imbalance by generating synthetic samples or undersampling
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[Dict[str, Any]]: Balanced dataset
        """
        class_field = self.config.get("class_field", "class")
        min_samples = self.config.get("min_samples_per_class", 50)
        
        # Check if we have class labels
        if not all(class_field in sample for sample in dataset):
            return dataset
            
        # Group by class
        classes = {}
        for sample in dataset:
            class_label = sample.get(class_field)
            if class_label not in classes:
                classes[class_label] = []
            classes[class_label].append(sample)
            
        # Find majority and minority classes
        class_counts = {c: len(samples) for c, samples in classes.items()}
        majority_count = max(class_counts.values())
        
        # Balance dataset
        balanced_dataset = []
        
        for class_label, samples in classes.items():
            count = len(samples)
            
            # If class has enough samples, add them all
            if count >= min_samples:
                balanced_dataset.extend(samples)
                continue
                
            # Otherwise, generate synthetic samples
            synthetic_count = min(majority_count, min_samples) - count
            synthetic_count = min(synthetic_count, self.config.get("max_synthetic_samples", 500))
            
            if synthetic_count <= 0:
                balanced_dataset.extend(samples)
                continue
                
            # Add original samples
            balanced_dataset.extend(samples)
            
            # Generate synthetic samples
            synthetic_samples = self._generate_synthetic_samples(samples, synthetic_count)
            balanced_dataset.extend(synthetic_samples)
            
        return balanced_dataset
    
    def _generate_synthetic_samples(self, samples: List[Dict[str, Any]], count: int) -> List[Dict[str, Any]]:
        """
        Generate synthetic samples based on existing samples
        
        Args:
            samples: List of samples from the same class
            count: Number of synthetic samples to generate
            
        Returns:
            List[Dict[str, Any]]: Synthetic samples
        """
        if not samples:
            return []
            
        synthetic_samples = []
        input_field = self.config.get("input_field", "input")
        output_field = self.config.get("output_field", "output")
        
        # In a real implementation, use more sophisticated techniques
        # For now, use simple augmentation by combining samples
        
        for i in range(count):
            # Select two random samples
            idx1 = np.random.randint(0, len(samples))
            idx2 = np.random.randint(0, len(samples))
            
            sample1 = samples[idx1]
            sample2 = samples[idx2]
            
            # Create a new synthetic sample
            synthetic = sample1.copy()
            
            # Mix input (in a real implementation, use better techniques)
            input1 = str(sample1.get(input_field, ""))
            input2 = str(sample2.get(input_field, ""))
            
            if len(input1) > 0 and len(input2) > 0:
                # Simple augmentation: take first half from one, second half from other
                split_point = len(input1) // 2
                synthetic_input = input1[:split_point] + " " + input2[len(input2) // 2:]
                synthetic[input_field] = synthetic_input
                
            # For output, just use one of the original outputs
            synthetic["synthetic"] = True
            
            synthetic_samples.append(synthetic)
            
        return synthetic_samples
    
    def remove_duplicates(self, dataset: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove duplicate samples from the dataset
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[Dict[str, Any]]: Dataset without duplicates
        """
        duplicates = set(self._find_duplicates(dataset))
        return [sample for i, sample in enumerate(dataset) if i not in duplicates]
    
    def remove_outliers(self, dataset: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove outlier samples from the dataset
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[Dict[str, Any]]: Dataset without outliers
        """
        outliers = set(self._find_outliers(dataset))
        return [sample for i, sample in enumerate(dataset) if i not in outliers]
    
    def remove_noise(self, dataset: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove noisy samples from the dataset
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[Dict[str, Any]]: Dataset without noise
        """
        noise = set(self._find_noise(dataset))
        return [sample for i, sample in enumerate(dataset) if i not in noise]
    
    def optimize_dataset(self, dataset: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Apply all optimizations to the dataset
        
        Args:
            dataset: List of data samples
            
        Returns:
            List[Dict[str, Any]]: Optimized dataset
        """
        # First, remove duplicates
        dataset = self.remove_duplicates(dataset)
        
        # Then remove outliers
        dataset = self.remove_outliers(dataset)
        
        # Then remove noise
        dataset = self.remove_noise(dataset)
        
        # Finally, fix class imbalance
        dataset = self.fix_class_imbalance(dataset)
        
        return dataset
    
    def generate_report(self, original_dataset: List[Dict[str, Any]], optimized_dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate a report comparing original and optimized datasets
        
        Args:
            original_dataset: Original dataset
            optimized_dataset: Optimized dataset
            
        Returns:
            Dict[str, Any]: Report with statistics
        """
        original_stats = self.analyze_dataset(original_dataset)
        optimized_stats = self.analyze_dataset(optimized_dataset)
        
        report = {
            "original": {
                "total_samples": original_stats.total_samples,
                "class_distribution": original_stats.class_distribution,
                "avg_input_length": original_stats.avg_input_length,
                "avg_output_length": original_stats.avg_output_length,
                "duplicates_count": original_stats.duplicates_count,
                "outliers_count": original_stats.outliers_count,
                "noise_count": original_stats.noise_count
            },
            "optimized": {
                "total_samples": optimized_stats.total_samples,
                "class_distribution": optimized_stats.class_distribution,
                "avg_input_length": optimized_stats.avg_input_length,
                "avg_output_length": optimized_stats.avg_output_length,
                "duplicates_count": optimized_stats.duplicates_count,
                "outliers_count": optimized_stats.outliers_count,
                "noise_count": optimized_stats.noise_count
            },
            "changes": {
                "samples_removed": original_stats.total_samples - optimized_stats.total_samples,
                "samples_added": max(0, optimized_stats.total_samples - original_stats.total_samples),
                "duplicates_removed": original_stats.duplicates_count - optimized_stats.duplicates_count,
                "outliers_removed": original_stats.outliers_count - optimized_stats.outliers_count,
                "noise_removed": original_stats.noise_count - optimized_stats.noise_count
            }
        }
        
        return report
    
    def save_dataset(self, dataset: List[Dict[str, Any]], output_path: str):
        """
        Save dataset to a JSON file
        
        Args:
            dataset: List of data samples
            output_path: Path to save the JSON file
        """
        with open(output_path, 'w') as f:
            json.dump(dataset, f, indent=2)
            
        logger.info(f"Saved dataset with {len(dataset)} samples to {output_path}")
    
    def load_dataset(self, input_path: str) -> List[Dict[str, Any]]:
        """
        Load dataset from a JSON file
        
        Args:
            input_path: Path to the JSON file
            
        Returns:
            List[Dict[str, Any]]: Loaded dataset
        """
        with open(input_path, 'r') as f:
            dataset = json.load(f)
            
        logger.info(f"Loaded dataset with {len(dataset)} samples from {input_path}")
        return dataset


# Example usage
if __name__ == "__main__":
    # Create a configuration for automotive data
    config = {
        "input_field": "query",
        "output_field": "response",
        "class_field": "category",
        "min_samples_per_class": 30,
        "duplicate_threshold": 0.9,
        "outlier_threshold": 0.2,
        "noise_detection_confidence": 0.7,
        "max_synthetic_samples": 100,
        "vectorizer": "tfidf",
        "clustering_eps": 0.3,
        "clustering_min_samples": 3
    }
    
    # Initialize the Dataset Refiner
    refiner = SmartDatasetRefiner(config=config)
    
    # Example automotive dataset
    dataset = [
        {
            "query": "What's the best way to negotiate a car price at a dealership?",
            "response": "Research the market value beforehand, be prepared to walk away, negotiate the total price not monthly payments, and consider timing your purchase at the end of month or quarter.",
            "category": "sales"
        },
        {
            "query": "How do I get the best deal when buying a new car?",
            "response": "Research market prices, shop at month/quarter end, negotiate total price not monthly payments, be willing to walk away, and consider pre-approved financing.",
            "category": "sales"
        },
        {
            "query": "What maintenance does a Tesla Model 3 need?",
            "response": "Tesla Model 3 requires minimal maintenance compared to conventional vehicles: tire rotation every 6,250 miles, cabin air filter replacement every 2 years, brake fluid test every 2 years, and AC service every 4 years.",
            "category": "maintenance"
        },
        {
            "query": "How often should I change oil in my Toyota Camry?",
            "response": "For most Toyota Camry models, the recommended oil change interval is every 5,000 to 7,500 miles or every 6 months, whichever comes first. If using synthetic oil, you may extend to 10,000 miles.",
            "category": "maintenance"
        },
        {
            "query": "What's the difference between AWD and 4WD?",
            "response": "AWD (All-Wheel Drive) automatically sends power to all wheels continuously, ideal for on-road varying conditions. 4WD (Four-Wheel Drive) is typically selectable, more robust for off-road use, and often includes low-range gearing for difficult terrain.",
            "category": "technical"
        }
    ]
    
    # Duplicate the dataset to create more samples
    expanded_dataset = []
    for i in range(20):
        for sample in dataset:
            new_sample = sample.copy()
            if i > 0:
                new_sample["query"] = f"{new_sample['query']} (version {i})"
            expanded_dataset.append(new_sample)
    
    # Add some outliers and noise
    expanded_dataset.append({
        "query": "What's the recipe for chocolate chip cookies?",
        "response": "Mix butter, sugar, eggs, flour, and chocolate chips. Bake at 375°F for 10 minutes.",
        "category": "maintenance"  # Intentionally mislabeled
    })
    
    expanded_dataset.append({
        "query": "XYZ123 maintenance schedule?",
        "response": "Regular service intervals at 10k, 20k, 30k miles.",
        "category": "maintenance"
    })
    
    # Analyze the dataset
    stats = refiner.analyze_dataset(expanded_dataset)
    print(f"Original dataset stats: {stats}")
    
    # Optimize the dataset
    optimized_dataset = refiner.optimize_dataset(expanded_dataset)
    
    # Generate report
    report = refiner.generate_report(expanded_dataset, optimized_dataset)
    print(json.dumps(report, indent=2))