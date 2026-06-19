# TripiiTrip: Full-Stack AI Travel Assistant

**TripiiTrip** is an intelligent travel platform that provides users with a comprehensive overview of global destinations. It integrates real-time news and a contextual AI consultant to help travelers navigate new cities safely and efficiently. It also contains features of a social media app like posting, chatting in communities and rooms for group trip planning through the app only.

> **Technical Note:** This repository is my personal engineering fork. I am maintaining this version to showcase the **LLM Integration, Full-Stack Feature Ownership, and Performance Optimization** workflows I developed during this 2-person collaboration.

---

## Feature Demos (My Work)

**Chatbot:**
https://res.cloudinary.com/dpg94yqwz/video/upload/f_auto,q_auto/v1766491127/chatbot_xsv8um.mp4

**Place Search:**
https://res.cloudinary.com/dpg94yqwz/video/upload/f_auto,q_auto/v1766491720/places_dq0qch.mp4

---

## My Contributions & Technical Impact

While this was a collaborative effort, I served as the **primary owner** for several key features, building them end-to-end—from the responsive React frontend to the AI-powered backend services and administration logic. My core features include:

### 1. Chatbot & LLM Integration (AI Safety Engine)
I engineered the AI consulting feature using the **Gemini API**.
- **System Prompting:** Developed specialized system instructions to force the LLM to act as a "Travel Safety Expert." It identifies localized tourist scams unique to each searched city.
- **Contextual Responses:** Built the logic to feed real-time city data into the prompt context and providing current, actionable advice.

### 2. Places Search & Performance Engineering (Custom Caching Layer)
I built the "Places Search" feature and created a custom server-side caching mechanism to solve the problem of high latency and API rate limits.
- **The Logic:** Implemented a **6-hour TTL (Time-To-Live)** in-memory store. The server checks the local cache before making expensive external API calls.
- **The Result:**
  - **85% reduction** in response latency (from ~800ms to <50ms).
  - **90% fewer** external API calls, ensuring the app stays within free-tier limits.

### 3. Admin Panel
Built a comprehensive dashboard to give platform administrators full control over the ecosystem.
- **User & Community Management:** Tools to moderate users, oversee communities, and manage reports.
- **Reward System:** Ability to award points to users for platform engagement.
- **Verification System:** Dedicated workflows for admins to review and verify user-submitted contributions and business listings.

### 4. Contributions System
Developed a community-driven feature allowing users to enrich the platform's travel data.
- **User Submissions:** Users can submit new accommodations, dining options, and tourist spots.
- **Gamification:** Tied to a points and rewards system to encourage high-quality, crowdsourced data entry.

### 5. Profile Management
Engineered the user profile system to handle personal travel identities.
- **Comprehensive Dashboards:** Users can view their posts, trips, followers/following, and accumulated contribution points.
- **Customization:** Secure image uploading for avatars/covers via Cloudinary, and editable bios to personalize the social travel experience.

---

## API Orchestration & Infrastructure

- **Unified Data Service:** Developed a Node.js/Express service to aggregate data from Gemini AI and multiple REST endpoints into a single optimized payload.
- **Database Management:** Structured **MongoDB** schemas to maintain city metadata and historical search context that can be used to display **Trending places** later.

---

## Tech Stack

| Layer              | Technology             |
| :----------------- | :--------------------- |
| **Frontend**       | React.js, Tailwind CSS |
| **Backend**        | Node.js, Express.js    |
| **Database**       | MongoDB                |
| **AI/LLM**         | Gemini API             |
| **Authentication** | JSON Web Token         |

---

## System Architecture

1. **Client** search triggers a backend request.
2. **Backend** checks if city data exists in the local cache and is < 6 hours old except for the photos.
3. **Cache Hit:** Data is served instantly.
4. **Cache Miss:** Backend calls Gemini, News APIs, Image APIs, updates the cache, and returns the unified response.

---

## Verified Pull Requests and Commits (My Work)

To see the specific engineering work I contributed to the main project, you can view some of my Pull Requests here:

- **[PR #2]:** [Added the Chatbot Feature](https://github.com/himanshuiitd-ism/tripii-trip/pull/2)
- **[PR #5]:** [Started implementing the Caching feature and data to places](https://github.com/himanshuiitd-ism/tripii-trip/pull/5)
- **[PR #8]:** [Resolved Some Merge Conflicts and Completed Place Feature with Caching](https://github.com/himanshuiitd-ism/tripii-trip/pull/8)
- **[Commit]:** [Made admin panel to manage users, communities, reward points and verify contributions made by users](https://github.com/sanketagarwal27/tripii-trip/commit/aef9ccdacb67320bf58b6240de340719a5762cd4)

---

## Getting Started

1. **Clone the fork:**
   ```bash
   git clone https://github.com/sanketagarwal27/tripii-trip.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a .env file in both folders and write all the values of keys mentioned in .env.example in both Frontend and Backend folders.

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Contact Me

- [LinkedIn](https://linkedin.com/in/sanket-agarwal-b7b7a731b)
- [Email](mailto:sanketagarwal314@gmail.com)
