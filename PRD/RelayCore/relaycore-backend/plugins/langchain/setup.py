from setuptools import setup, find_packages

setup(
    name="relaycore-langchain",
    version="0.1.0",
    description="RelayCore integration for LangChain",
    author="RelayCore",
    author_email="info@relaycore.ai",
    packages=find_packages(),
    install_requires=[
        "langchain>=0.0.267",
        "requests>=2.28.0",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
)