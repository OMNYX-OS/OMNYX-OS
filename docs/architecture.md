# Architecture Overview

This document explains how OMNYX system flows work.

---

## 1.Device Scan Flow

```mermaid
graph TD
A[Native Modules] --> B[Permission Data]
B --> C[privacyIntelligence.ts]
C --> D[Zustand Store]
D --> E[React Components]
```


---

## 2. AI Flow

```mermaid
graph TD
A[Threat Event] --> B[aiProxy.ts]
B --> C[server/proxy.ts]
C --> D[AI Provider Claude API]
D --> E[Client Response]
```


---

## 3. State Flow


```mermaid
graph TD
A[Zustand Store] --> B[React Components]
```

---


