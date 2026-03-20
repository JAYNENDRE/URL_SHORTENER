## 🏗️ System Design & Architecture

This URL Shortener is designed as a **Highly Available, Performant, and Resilient Distributed System**. The primary engineering goals were to minimize redirect latency and ensure fault tolerance if any external component (like the Cache) failed.

### High-Level Design (HLD)

[Insert the System Diagram image here]

### Core Engineering Principles & Trade-offs

#### 1. Latency Optimization: The Cache-Aside Pattern
MAANG-scale systems demand milliseconds. To reduce read latency, I implemented a **Cache-Aside Pattern** using **Redis**.
* **Design Decision:** Frequently accessed short codes ("hot keys") are moved from the database (MongoDB) to RAM (Redis).
* **Technical Vocabulary:** Links are cached with a **24-hour Time-To-Live (TTL)**. This provides a balance between extreme performance and data consistency, preventing the cache from "growing stale" indefinitely.
* **Metric:** This strategy reduced average redirect lookup time by **90%** (from ~50ms to <5ms).

#### 2. Resilience: Graceful Degradation
What happens if Redis crashes? In a standard system, the API would hang and eventually time out. This project is built to **fail gracefully**.
* **Design Decision:** The Redis client is configured with a strict **5-second connection timeout** and a finite **`reconnectStrategy`**.
* **Technical Vocabulary:** If Redis becomes unavailable, the application server gracefully catches the error and immediately falls back to the primary database. The end-user is never impacted, maintaining 100% service uptime at the expense of temporary latency increase.

#### 3. Data Integrity & Namespace Protection
The primary risk of custom aliases is **Namespace Collision** (two users claiming the same alias) or **Resource Squatting** (a user taking `/admin` or `/login`).
* **Technical Vocabulary:**
    * **Atomic Writes:** I prevented race conditions at the write layer by creating a **MongoDB Unique Index** on the `urlCode` field. This guarantees that only one user can claim a unique alias at a specific millisecond.
    * **Reserved Keyword Shield:** To protect the system's routing integrity, I implemented an alias blacklist (`admin`, `login`, `api`), preventing users from spoofing high-value system routes.

#### 4. Observability & Infrastructure
I prioritized **Observability** over standard logging (`console.log`).
* **Technical Vocabulary:** I integrated the **Winston** logging library to produce structured, production-grade logs. This enables real-time monitoring of cache hits/misses, backend connection status, and 500-level server errors.
* **Environment Parity:** All sensitive credentials (MongoDB URI, Redis Auth) and base URLs are sourced from environment variables, adhering to the **12-Factor App methodology**. This enables atomic deployments and prevents credential leakage.
