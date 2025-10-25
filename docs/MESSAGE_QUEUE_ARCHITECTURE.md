

# 📨 Message Queue Architecture (Kafka & RabbitMQ

)

#

# Overvie

w

Event and queue patterns across services for reliability and decoupling.

#

# Topics & Queue

s

- Kafka topics: analytics events, workflow events, ai event

s

- RabbitMQ queues: task queues, DLQ per servic

e

#

# Pattern

s

- Producers in core/AI services; consumers in analytics/processor

s

- Retry with DLQ; idempotent handlers; outbox where neede

d

#

# Monitorin

g

- Export lag, consumer health; alert on DLQ growt

h

