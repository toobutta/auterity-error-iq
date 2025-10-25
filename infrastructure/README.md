

# Infrastructure Setu

p

This directory contains the optimized infrastructure setup for Auterity's analytics stack, including ClickHouse, Kafka, Zookeeper, and Apache Superset with resource limits and performance optimizations.

#

# 🏗️ Architecture Overvie

w

```
┌─────────────────┐    ┌─────────────────┐
│   API Layer     │────│  ClickHouse     │
│   (Express.js)  │    │  (Analytics DB) │
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
┌─────────────────┐    ┌─────────────────┐
│     Kafka       │────│   Superset      │
│  (Message Bus)  │    │ (Dashboards)    │
└─────────────────┘    └─────────────────┘
         │
         │
┌─────────────────┐
│   Zookeeper     │
│ (Coordination)  │
└─────────────────┘

```

#

# 🐳 Service

s

#

## ClickHouse (Analytics Database)

- **Image**: `yandex/clickhouse-server:latest

`

- **Purpose**: High-performance OLAP database for real-time analytic

s

- **Ports**

:

  - `8123`: HTTP interface for querie

s

  - `9000`: Native client interfac

e

- **Resource Limits**

:

  - Memory: 8G

B

  - CPU: 2 core

s

- **Optimizations**

:

  - Connection pooling enable

d

  - Gzip compressio

n

  - Memory usage limit

s

#

## Kafka (Message Bus)

- **Image**: `confluentinc/cp-kafka:latest

`

- **Purpose**: Real-time data ingestion and streamin

g

- **Ports**

:

  - `9092`: Kafka broker interfac

e

- **Resource Limits**

:

  - Memory: 2G

B

  - CPU: 1 cor

e

- **Configuration**

:

  - Heap size: 1G

B

  - Single broker setu

p

  - Offset replication factor:

1

#

## Zookeeper (Coordination)

- **Image**: `confluentinc/cp-zookeeper:latest

`

- **Purpose**: Distributed coordination for Kafk

a

- **Ports**

:

  - `2181`: Zookeeper client por

t

- **Resource Limits**

:

  - Memory: 512M

B

  - CPU: 0.5 cor

e

s

- **Configuration**

:

  - JVM heap: 512M

B

  - Tick time: 2000m

s

#

## Apache Superset (Dashboards)

- **Image**: `apache/superset:latest

`

- **Purpose**: Business intelligence and data visualizatio

n

- **Ports**

:

  - `8088`: Superset web interfac

e

- **Resource Limits**

:

  - Memory: 2G

B

  - CPU: 1 cor

e

- **Configuration**

:

  - Examples disabled for performanc

e

  - Connected to ClickHouse for data source

s

#

# 🚀 Quick Star

t

#

## Prerequisites

- Docker 20.1

0

+ - Docker Compose 2.

0

+ - 16G

B

+ available RA

M

- 4

+ CPU core

s

#

## Start All Services

```

bash
cd infrastructure
docker-compose up -

d

```

#

## Verify Services

```

bash

# Check container status

docker-compose p

s

# View logs

docker-compose logs -f [service-name

]

# Test ClickHouse

curl "http://localhost:8123/?query=SELECT%201"

# Test Kafka

docker-compose exec kafka kafka-console-producer --broker-list localhost:9092 --topic tes

t

```

#

## Stop Services

```

bash
docker-compose dow

n

```

#

# ⚙️ Configuratio

n

#

## Environment Variables

Services are configured with optimized settings for production use:

```

yaml

# ClickHouse

CLICKHOUSE_MAX_MEMORY_USAGE: 8GB

# Kafka

KAFKA_HEAP_OPTS: "-Xmx1g -Xms1g

"

# Zookeeper

JVMFLAGS: "-Xmx512m -Xms512m

"

# Superset

SUPERSET_LOAD_EXAMPLES: "no"

```

#

## Resource Limits

All services have resource constraints to prevent resource exhaustion:

| Service | Memory | CPU | Purpose |
|---------|--------|-----|---------|

| ClickHouse | 8GB | 2.0 | Analytics queries |

| Kafka | 2GB | 1.0 | Message processing |

| Zookeeper | 512MB | 0.5 | Coordination |

| Superset | 2GB | 1.0 | Dashboard rendering

|

#

# 📊 Performance Optimization

s

#

## ClickHouse Optimizations

- **Memory Management**: 8GB limit prevents OO

M

- **Connection Pooling**: Efficient resource usag

e

- **Compression**: Gzip for network efficienc

y

- **Indexing**: Optimized for analytical querie

s

#

## Kafka Optimizations

- **Heap Sizing**: 1GB heap for stable performanc

e

- **Replication**: Single replica for developmen

t

- **Partitioning**: Configurable partitions per topi

c

#

## Superset Optimizations

- **Examples Disabled**: Faster startup, less memory usag

e

- **Caching**: Built-in query result cachin

g

- **Async Queries**: Non-blocking dashboard load

s

#

# 🔧 Maintenanc

e

#

## Backup ClickHouse Data

```

bash

# Stop ClickHouse

docker-compose stop clickhous

e

# Backup data volume

docker run --rm -v auterity_clickhouse_data:/data -v $(pwd):/backup alpine tar czf /backup/clickhouse-backup.tar.gz -C /data

.

# Start ClickHouse

docker-compose start clickhous

e

```

#

## Monitor Resource Usage

```

bash

# View container stats

docker stats

# Check logs for errors

docker-compose logs --tail=100 [service-name

]

```

#

## Scale Services

```

bash

# Scale Kafka brokers

docker-compose up -d --scale kafka=

3

# Scale ClickHouse (requires cluster setup

)

# See ClickHouse documentation for clustering

```

#

# 🔒 Security Consideration

s

#

## Network Security

- Services communicate via Docker network

s

- Exposed ports are documented and minima

l

- No default passwords in productio

n

#

## Data Security

- ClickHouse data persisted in named volume

s

- Kafka messages can be encrypted at res

t

- Superset requires secure secret ke

y

#

## Access Control

- API layer handles authenticatio

n

- Database access restricted to AP

I

- Monitoring endpoints protecte

d

#

# 📈 Monitorin

g

#

## Built-in Monitorin

g

- **Health Checks**: Container health endpoint

s

- **Logs**: Centralized logging with `docker-compose logs

`

- **Metrics**: Prometheus integration in API laye

r

#

## External Monitoring

```

bash

# Install Prometheus and Grafan

a

# Configure scrape targets for container

s

# Set up dashboards for resource monitoring

```

#

# 🐛 Troubleshootin

g

#

## Common Issue

s

#

### ClickHouse Connection Refused

```

bash

# Check if container is running

docker-compose ps clickhous

e

# View ClickHouse logs

docker-compose logs clickhous

e

# Restart ClickHouse

docker-compose restart clickhous

e

```

#

### Kafka Broker Not Available

```

bash

# Check Zookeeper first

docker-compose logs zookeepe

r

# Check Kafka logs

docker-compose logs kafk

a

# Test connectivity

docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:909

2

```

#

### Superset Connection Issues

```

bash

# Check Superset logs

docker-compose logs superse

t

# Verify ClickHouse connectivity from Superset

docker-compose exec superset superset db upgrad

e

```

#

## Performance Tunin

g

#

### High Memory Usage

- Reduce ClickHouse memory limit if neede

d

- Monitor with `docker stats

`

- Adjust JVM heap size

s

#

### Slow Queries

- Add indexes to ClickHouse table

s

- Increase Kafka partition

s

- Optimize Superset dashboard querie

s

#

# 📚 Additional Resource

s

- [ClickHouse Documentation](https://clickhouse.com/docs/

)

- [Kafka Documentation](https://kafka.apache.org/documentation/

)

- [Apache Superset Documentation](https://superset.apache.org/docs/

)

- [Docker Compose Documentation](https://docs.docker.com/compose/

)

#

# 🤝 Contributin

g

1. Update configurations in `docker-compose.ym

l

`

2. Test changes locall

y

3. Update this READM

E

4. Submit pull reques

t

#

# 📄 Licens

e

This infrastructure setup is part of the Auterity project.
