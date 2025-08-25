# Performance Benchmark Script
# Simple benchmarking for backend endpoints

import time

import requests

ENDPOINTS = [
    "http://localhost:8000/api/v1/automotive/templates",
    "http://localhost:8000/api/v1/automotive/datasets",
]


def benchmark_endpoint(url):
    start = time.time()
    try:
        response = requests.get(url)
        elapsed = time.time() - start
        print(f"{url}: {elapsed:.3f}s, status {response.status_code}")
    except Exception as e:
        print(f"{url}: ERROR {e}")


if __name__ == "__main__":
    for endpoint in ENDPOINTS:
        benchmark_endpoint(endpoint)
