# Feedlyzer - RSS Feed Aggregation and Topic Analysis

## Overview

**Feedlyzer** is a news aggregator and analysis platform built using **NestJS**, **PostgreSQL**, **TypeORM**, and **Meilisearch**. It fetches and indexes articles from various RSS feeds and utilizes **GroqCloud** AI models for advanced topic and entity extraction, helping users explore and search news more efficiently. This project provides a lightning-fast search API, making it easy to query articles based on keywords, named entities (people, locations, organizations), and more.

## Features

1. **Fetch Data**:

    - Fetches news articles from configurable RSS feeds.
    - Handles potential errors (e.g., invalid URLs or network issues).

2. **Persist Data**:

    - Stores fetched news articles in **PostgreSQL** using **TypeORM**.
    - Stores fields such as title, description, publication date, source URL, and extracted topics like: keywords, people, locations, organizations.

3. **Batch Topic Extraction**:

    - Extracts topics, keywords, and named entities using **GroqCloud** for AI model integration.
    - Supports **batch processing** of articles to efficiently extract topics and entities in bulk.
    - AI-powered topic extraction and classification of articles.
    - Performs named entity recognition (people, locations, organizations) on news articles.

4. **Lightning-fast Search API - Meilisearch Integration**:

    - Supports quick retrieval of articles based on title, topics, keywords, publication date (in YYYY-MM-DD format), people, locations, and organizations.
    - The search API supports partial matching and is case-insensitive for optimal user experience.

5. **Scheduled Extraction**:
    - Automatically fetches and processes new articles every day at 10 AM.
    - The scheduler interval can be customized.

## Technologies Used

-   **NestJS**: For building the backend application.
-   **Docker**: For containerizing the application.
-   **PostgreSQL**: For storing news articles and related data.
-   **TypeORM**: For database management and data persistence.
-   **Meilisearch**: For fast full-text search and indexing.
-   **GroqCloud**: For AI model integration to extract topics, keywords, and named entities.

## Setup Instructions

### Prerequisites

-   **🐳 Docker** installed

### Steps

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/mobin-ism/Feedlyzer.git
    cd Feedlyzer
    ```

2. **Spin up the Docker container**:

    ```bash
     sudo docker compose up --build
    ```

3. **Access Application API**:
    - Use Swagger UI for API testing: `http://localhost:3000/docs`
    - Meilisearch will be running at: `http://localhost:7700`

### Usage

1. **Configure RSS Feeds**:

    - Use the **Source Configuration API** to add or modify RSS feed URLs. You can configure multiple sources to be tracked by sending a `POST` request with the feed URL to the `/api/source-configuration` endpoint:
        ```bash
        POST /api/source-configuration
        {
          "name": "Tech News",
          "sources": [
                "https://www.wired.com/feed/rss"
            ]
        }
        ```
        - You can also list, update, or delete sources using the respective endpoints (`GET /api/source-configuration`, `PUT /api/source-configuration/:uuid`, `DELETE /api/source-configuration/:uuid`).

2. **Fetch News Articles and Extract Topics, Keywords, People, Locations, and Organizations**:

    - Once sources are configured, trigger news articles fetching by sending a `POST` request to the `/api/article` endpoint, providing the **source configuration UUID**:
        ```bash
        POST /api/article
        {
          "sourceConfigurationUuid": "UUID-of-the-source-configuration"
        }
        ```
    - The system will automatically extract relevant information such as **keywords**, **categories**, **people**, **locations**, and **organizations** from the fetched articles.

3. **Search Articles by Title, Topic, Keyword, Category, Publication Date, People, Locations, or Organizations**:

    - Use **Meilisearch** to search for articles by any of these fields. For example, to search for articles containing a specific keyword:
        ```bash
        GET /api/article/search
        {
          "keyword": "election"
        }
        ```
    - You can also filter by **publication date** or other metadata like **people** or **locations**:

        ```bash
        GET /api/article/search
        {
          "keyword": "Donald Trump"
        }
        ```

        ```bash
        GET /api/article/search
        {
          "keyword": "2024-10-26"
        }
        ```

    - The search API returns articles that match the query across any of the configured fields.

## Additional Notes

-   **Scheduler**: A scheduler is configured to periodically fetch and process new articles.

## Improvements

-   **Background Jobs**: A background job can be integrated for large data extraction using HTTP request.
