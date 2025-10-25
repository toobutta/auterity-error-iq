

# 🔁 Cross-System Protoc

o

l

#

# Overvie

w

Contracts and policies for communication across services (HTTP, WS, events).

#

# Convention

s

- Trace IDs propagated via `X-Request-ID

`

- Auth via JWT; service-to-service via mTLS when applicabl

e

- Error schema: code, message, details, remediatio

n

#

# Eventin

g

- Topics: `analytics.*`, `workflow.*`, `ai.*`, `alerts.*

`

- Payload versioning and compatibilit

y

