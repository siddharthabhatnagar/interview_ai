# IntervuAI LiveKit Agent
# Real-time AI interviewer using LiveKit, Cerebras, and Deepgram

import os
import sys
import json
import asyncio
import aiohttp
from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions
from livekit.plugins import openai, silero, deepgram
from dotenv import load_dotenv
load_dotenv()

def check_environment_vars():
    required_vars = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "DEEPGRAM_API_KEY",
        "CEREBRAS_API_KEY",
    ]
    missing = [v for v in required_vars if not os.environ.get(v)]
    if missing:
        print("Missing required environment variables:", file=sys.stderr)
        for v in missing:
            print(f"  - {v}", file=sys.stderr)
        sys.exit(1)
    print("All required API keys loaded.")

# Question banks by interview type and difficulty
QUESTION_BANKS = {
    "frontend": {
        "beginner": [
            "Could you walk me through your process of building a responsive layout from scratch?",
            "How do you usually decide between let, const, and var when writing JavaScript?",
            "Can you explain how you handle basic state and props in a React application?",
            "What's your approach to semantic HTML, and why do you think it matters?",
            "How would you explain the CSS box model to a junior developer?",
            "Tell me about how you handle forms and form validation on the frontend.",
            "What's the difference between inline, block, and inline-block elements, and when do you use each?",
            "How do you approach making a website accessible for screen readers?",
            "Can you explain the difference between relative, absolute, and fixed positioning in CSS?",
            "Walk me through how you would fetch data from an API and display it in a React component.",
            "What tools do you use for debugging CSS layout issues?",
            "How do you structure your component files and folders in a React project?",
        ],
        "intermediate": [
            "If you noticed your React app was rendering slowly, what steps would you take to debug and fix it?",
            "Can you walk me through a practical scenario where you used closures to solve a problem?",
            "How do you usually handle complex state management? When would you reach for Redux or Context?",
            "What's your strategy for writing clean, maintainable, and reusable CSS in a large project?",
            "Tell me about a time you had to optimize the loading speed or Critical Rendering Path of a web page.",
            "How do you implement code-splitting and lazy loading in a React application?",
            "Can you explain how React's reconciliation algorithm works and how the virtual DOM helps performance?",
            "Walk me through how you'd build a custom debounced search input from scratch.",
            "How do you approach testing React components? What's your strategy for unit vs integration tests?",
            "Tell me about your experience with TypeScript in frontend projects. What problems does it solve?",
            "How do you handle authentication flows on the frontend, including token storage and refresh?",
            "What's your approach to handling errors gracefully in a React application — both API errors and rendering errors?",
        ],
        "advanced": [
            "Walk me through how you would design and implement a custom React hook for a complex data-fetching scenario.",
            "How do you approach managing a large-scale frontend architecture? Have you ever dealt with micro-frontends?",
            "Tell me about your strategy for optimizing the bundle size of a heavy, enterprise-level web app.",
            "Can you explain the JavaScript event loop and how you handle complex asynchronous operations?",
            "How do you ensure accessibility standards are met across a complex, dynamic web application?",
            "Walk me through implementing a real-time collaborative editing feature, like Google Docs, on the frontend.",
            "How would you architect a frontend application that needs to work offline and sync data when back online?",
            "Tell me about your experience with web performance metrics — CLS, LCP, FID — and how you optimize for them.",
            "How do you approach incremental migration of a legacy jQuery or Angular app to React without a full rewrite?",
            "Can you explain how you'd implement a design system with component versioning across multiple teams?",
            "Walk me through the security considerations when building a frontend that handles sensitive user data.",
            "How do you handle internationalization and right-to-left language support in a complex SPA?",
        ],
    },
    "backend": {
        "beginner": [
            "When starting a new project, how do you decide whether to use a SQL or NoSQL database?",
            "Can you walk me through how you design RESTful API endpoints?",
            "How do you use middleware in frameworks like Express.js? Can you give a practical example?",
            "Explain how you handle user input validation and basic security in your routes.",
            "What's your approach to managing environment variables and secrets in a project?",
            "How do you structure your project folders for a backend application?",
            "Can you explain what a JOIN is in SQL and when you'd use different types?",
            "What's the purpose of status codes in HTTP, and which ones do you find yourself using most?",
            "How do you handle file uploads in a backend API?",
            "Tell me about how you approach logging and debugging in server-side applications.",
            "What's the difference between synchronous and asynchronous code execution in Node.js?",
            "How do you handle database connection errors or timeouts gracefully?",
        ],
        "intermediate": [
            "Walk me through how you handle user authentication and authorization in your applications.",
            "Tell me about a time a database query was bottlenecking your app. How did you optimize it?",
            "How do you structure your error handling in a complex backend service?",
            "Can you explain how you'd implement connection pooling and why it's necessary?",
            "What's your approach to writing automated tests for your backend endpoints?",
            "How do you design a database schema that balances normalization with query performance?",
            "Walk me through implementing a caching layer — when do you use Redis vs in-memory caching?",
            "How do you handle API versioning when you need to make breaking changes?",
            "Tell me about your approach to implementing webhook systems that are reliable and idempotent.",
            "How do you secure an API against common vulnerabilities like SQL injection, XSS, and CSRF?",
            "Can you explain the trade-offs between horizontal and vertical scaling for a backend service?",
            "How do you design background job processing for tasks like sending emails or generating reports?",
        ],
        "advanced": [
            "If our user base suddenly spiked to a million concurrent users, how would you architect the backend to handle the load?",
            "Tell me about your experience with implementing distributed transactions or event-driven architectures.",
            "How do you implement robust rate limiting to protect your APIs from abuse?",
            "Walk me through your strategies for database replication, sharding, and high availability.",
            "How do you handle asynchronous background processing for heavy, time-consuming tasks?",
            "Tell me about designing a multi-tenant SaaS backend — how do you isolate data and handle shared resources?",
            "How would you implement a real-time event streaming system using something like Kafka or RabbitMQ?",
            "Walk me through designing an API gateway that handles authentication, rate limiting, and request routing.",
            "How do you approach database migrations in production without downtime?",
            "Tell me about your strategy for implementing distributed caching with cache invalidation.",
            "How do you design a backend system that provides strong consistency guarantees while remaining performant?",
            "Walk me through implementing observability — structured logging, distributed tracing, and metrics collection.",
        ],
    },
    "fullstack": {
        "beginner": [
            "How do you typically structure the communication between your frontend and backend?",
            "Can you walk me through the complete lifecycle of a user logging into an app, from the button click to the database?",
            "What's your approach to handling CORS issues when they pop up during development?",
            "How do you ensure data stays synchronized between the client and the server?",
            "What's your preferred workflow for debugging an issue that spans both the frontend and backend?",
            "Tell me about how you set up a development environment for a full-stack project.",
            "How do you handle image or file uploads from the frontend all the way to storage?",
            "What's your approach to deploying a full-stack app for the first time?",
            "How do you decide which logic should live on the frontend versus the backend?",
            "Can you walk me through building a simple CRUD feature from database to UI?",
            "What tools do you use for API testing during development?",
            "How do you handle loading states and error states in the UI when making API calls?",
        ],
        "intermediate": [
            "How do you approach securing sensitive data, like passwords and API keys, across the entire stack?",
            "Can you explain your strategy for implementing JWT securely?",
            "How would you design and implement a feature that requires real-time updates for the user, like a chat system?",
            "When building a new app, how do you decide between Server-Side Rendering and Client-Side Rendering?",
            "Walk me through how you handle caching at different layers to improve overall application performance.",
            "How do you implement role-based access control that works consistently across frontend and backend?",
            "Tell me about your approach to handling database transactions that involve multiple services.",
            "How do you design a search feature with filtering, sorting, and pagination across the full stack?",
            "Walk me through your strategy for handling file storage — when do you use local storage vs cloud services like S3?",
            "How do you approach performance optimization when both the frontend and backend could be the bottleneck?",
            "Tell me about implementing email notifications or in-app notifications across the full stack.",
            "How do you manage shared validation logic between the frontend and backend?",
        ],
        "advanced": [
            "If you had to migrate a legacy monolithic application to a microservices architecture, what would be your first few steps?",
            "Design a real-time notification system architecture that needs to scale to millions of active users.",
            "How would you implement end-to-end encryption in a full-stack messaging application?",
            "Walk me through how you'd design a robust CI/CD pipeline for a complex full-stack application.",
            "How do you maintain observability, logging, and tracing across multiple full-stack services in production?",
            "Tell me about architecting a multi-region deployment for a full-stack app with data consistency requirements.",
            "How would you design a feature flag system that controls rollout across both frontend and backend?",
            "Walk me through building a payment processing system — handling Stripe or Razorpay webhooks, idempotency, and edge cases.",
            "How do you approach building a white-label SaaS product where each tenant can customize their experience?",
            "Tell me about implementing server-sent events or WebSockets at scale with proper error recovery.",
            "How would you design a data export feature that handles millions of rows without blocking the server?",
            "Walk me through your strategy for zero-downtime database schema migrations in a full-stack production app.",
        ],
    },
    "devops": {
        "beginner": [
            "How do you use Docker in your daily development workflow? What benefits does it bring you?",
            "Can you walk me through your ideal CI/CD pipeline setup for a standard web application?",
            "How do you approach version control and branching strategies in a team environment?",
            "Explain how you use reverse proxies like Nginx or HAProxy in your infrastructure.",
            "What's your standard process for safely applying updates or patches to a server?",
            "How do you monitor server health and resource usage in your current setup?",
            "Tell me about your experience with Linux command-line tools for troubleshooting.",
            "What's the difference between a container and a virtual machine, and when would you choose each?",
            "How do you handle SSH key management and access control for servers?",
            "Can you explain how DNS works and how you've configured it for projects?",
            "How do you back up databases and application data?",
            "What's your approach to documenting infrastructure and deployment procedures?",
        ],
        "intermediate": [
            "Walk me through the steps you take when setting up a new Kubernetes cluster.",
            "How do you implement Infrastructure as Code? What tools do you prefer and why?",
            "Can you explain your strategy for executing zero-downtime deployments, like blue-green or canary?",
            "How do you set up monitoring and alerting to catch infrastructure issues before users notice them?",
            "What's your approach to managing and rotating secrets in a production environment?",
            "Tell me about implementing auto-scaling policies — how do you decide scaling triggers and limits?",
            "How do you handle log aggregation and centralized logging across multiple services?",
            "Walk me through setting up a multi-stage Docker build for a production application.",
            "How do you approach network security — firewalls, VPCs, and network policies in cloud environments?",
            "Tell me about your experience with database DevOps — automated backups, point-in-time recovery, replication.",
            "How do you manage configuration across different environments (dev, staging, production)?",
            "What's your strategy for handling SSL/TLS certificate management and renewal?",
        ],
        "advanced": [
            "Walk me through your approach to disaster recovery. What happens if an entire availability zone goes down?",
            "How do you implement and enforce security policies across a large-scale Kubernetes cluster?",
            "Explain your experience with service mesh architectures. When do you think they become necessary?",
            "How do you optimize cloud infrastructure costs while maintaining high performance and availability?",
            "Tell me about your experience with chaos engineering. How do you intentionally break systems to make them more resilient?",
            "Walk me through designing a multi-cloud or hybrid-cloud strategy and the challenges involved.",
            "How do you handle compliance requirements like SOC 2, HIPAA, or GDPR at the infrastructure level?",
            "Tell me about implementing a GitOps workflow — how does it differ from traditional CI/CD?",
            "How do you architect observability for a system with hundreds of microservices?",
            "Walk me through your strategy for rolling back a failed deployment that has already affected live traffic.",
            "How do you design infrastructure that can handle 10x traffic spikes during peak events?",
            "Tell me about your approach to container security — image scanning, runtime protection, and policy enforcement.",
        ],
    },
    "ai_ml_engineer": {
        "beginner": [
            "Can you walk me through the basic steps of preparing a raw dataset for a machine learning model?",
            "How do you usually decide between using a classification algorithm versus a regression algorithm?",
            "Tell me about your approach to splitting data into training, validation, and test sets.",
            "How would you explain the concept of overfitting to someone who isn't technical?",
            "What standard metrics do you look at to evaluate the performance of a basic model?",
            "Can you explain the difference between supervised and unsupervised learning with examples?",
            "How do you handle categorical features in your datasets?",
            "Tell me about your experience with basic visualization tools for understanding data distributions.",
            "What's your approach to dealing with missing values in a dataset?",
            "How do you choose between different machine learning algorithms for a given problem?",
            "Can you explain what cross-validation is and why it's important?",
            "Tell me about a simple ML project you've completed from data collection to prediction.",
        ],
        "intermediate": [
            "Walk me through a time you had to deal with a highly imbalanced dataset. What techniques did you use?",
            "How do you approach feature engineering? Can you give an example of a feature you created that significantly improved a model?",
            "Tell me about your experience with deep learning frameworks like PyTorch or TensorFlow.",
            "How do you diagnose and fix a neural network that is suffering from vanishing or exploding gradients?",
            "Can you explain the trade-offs between using a complex ensemble model versus a simpler, interpretable model?",
            "Walk me through implementing a convolutional neural network — how do you decide on architecture and hyperparameters?",
            "How do you handle time-series data in machine learning, and what pitfalls have you encountered?",
            "Tell me about your experience with transfer learning — when does it work well and when does it fail?",
            "How do you approach model interpretability? What tools do you use to explain model decisions?",
            "Can you explain how attention mechanisms work and why they've become so important?",
            "Walk me through your hyperparameter tuning workflow — what strategies have worked best for you?",
            "How do you evaluate a model's performance beyond just accuracy — precision, recall, F1, AUC?",
        ],
        "advanced": [
            "How do you go about optimizing a large-scale machine learning model to reduce its inference latency in production?",
            "Walk me through your experience with distributed training across multiple GPUs or nodes.",
            "Tell me about a time you had to implement a custom loss function or neural network architecture from scratch.",
            "How do you approach continual learning or handling concept drift in models that have been in production for a while?",
            "Explain your strategy for compressing models, using techniques like quantization or pruning, for edge devices.",
            "How do you design ML systems that need to handle real-time predictions at scale?",
            "Tell me about your experience with self-supervised or contrastive learning approaches.",
            "Walk me through building a recommendation system — collaborative filtering vs content-based vs hybrid.",
            "How do you handle multi-task learning when you need one model to solve multiple related problems?",
            "Can you explain the mechanics of gradient accumulation and mixed-precision training?",
            "How do you approach debugging a model that performs well on metrics but fails in real-world deployment?",
            "Tell me about designing an ML pipeline that needs to retrain automatically when performance degrades.",
        ],
    },
    "gen_ai_engineer": {
        "beginner": [
            "Can you walk me through how you typically integrate a Large Language Model API, like OpenAI's, into a basic application?",
            "How do you approach writing and structuring prompts to get reliable outputs from an LLM?",
            "Explain what vector embeddings are and how you've used them in your projects.",
            "What's your strategy for handling token limits and context window restrictions?",
            "Tell me about a basic chatbot or generative application you've built recently.",
            "How do you handle API rate limits and errors when working with LLM providers?",
            "Can you explain the difference between zero-shot, few-shot, and fine-tuned approaches?",
            "What's your approach to choosing between different LLM providers for a project?",
            "Tell me about your experience with vector databases like Pinecone, Weaviate, or ChromaDB.",
            "How do you test the quality and consistency of LLM outputs?",
            "What security concerns do you think about when building LLM-powered applications?",
            "Walk me through building a simple question-answering system over a set of documents.",
        ],
        "intermediate": [
            "Walk me through the architecture of a Retrieval-Augmented Generation, or RAG, pipeline you've built.",
            "How do you evaluate the quality and accuracy of the responses generated by an LLM?",
            "Can you explain your approach to document chunking and indexing for semantic search?",
            "Tell me about your experience with fine-tuning open-source models versus using prompt engineering.",
            "How do you handle hallucinations in generative models to ensure users get factual information?",
            "Walk me through implementing a conversational AI system with memory that persists across sessions.",
            "How do you approach prompt injection attacks and security in LLM-powered apps?",
            "Tell me about your experience with function calling or tool use with LLMs.",
            "How do you handle multi-modal inputs — text plus images or documents — in your AI applications?",
            "Can you explain your approach to evaluating RAG pipeline quality — metrics like faithfulness and relevancy?",
            "How do you optimize LLM costs in production — caching, model routing, prompt optimization?",
            "Walk me through building a structured data extraction pipeline using LLMs.",
        ],
        "advanced": [
            "Walk me through how you design and implement autonomous AI agents using frameworks like LangChain or AutoGen.",
            "How do you optimize a RAG pipeline for complex queries, involving techniques like query routing or re-ranking?",
            "Tell me about a time you had to deploy and serve a large open-weight model, like LLaMA, on your own infrastructure.",
            "How do you approach building robust memory systems for AI agents that need to maintain context over long periods?",
            "Explain your strategy for building multimodal generative systems that process both text and images.",
            "How do you implement reliable AI agent workflows with error recovery and human-in-the-loop escalation?",
            "Walk me through designing a multi-agent system where different AI agents collaborate to solve complex tasks.",
            "How do you approach model distillation — training a smaller model to replicate a larger one's behavior?",
            "Tell me about building evaluation pipelines for LLM applications — automated testing at scale.",
            "How do you handle compliance and data privacy concerns when building enterprise GenAI solutions?",
            "Walk me through implementing streaming responses and real-time token generation in production.",
            "How do you design AI systems that gracefully degrade when the underlying model is unavailable or rate-limited?",
        ],
    },
    "mlops_engineer": {
        "beginner": [
            "How do you typically handle version control for your datasets and machine learning models?",
            "Can you walk me through the basic steps of taking a trained model and wrapping it in a Flask or FastAPI endpoint?",
            "What tools do you prefer for tracking model experiments and hyperparameters?",
            "How do you use Docker in the context of deploying machine learning models?",
            "Tell me about your approach to writing tests for machine learning code.",
            "What's the difference between model training and model serving, and what challenges does each present?",
            "How do you handle large dataset storage and versioning in your projects?",
            "Can you explain what a model registry is and how you'd use one?",
            "Tell me about your experience with basic cloud services for ML — like SageMaker, Vertex AI, or Azure ML.",
            "How do you monitor a deployed model's basic health — is it responding? Is it fast enough?",
            "What's your approach to reproducibility in machine learning experiments?",
            "How do you handle environment management — different Python versions, dependencies, CUDA versions?",
        ],
        "intermediate": [
            "Walk me through how you set up a CI/CD pipeline specifically tailored for machine learning models.",
            "How do you monitor models in production to detect data drift or model degradation over time?",
            "Can you explain the concept of a Feature Store and how you would implement one?",
            "Tell me about your experience with orchestrating ML workflows using tools like Apache Airflow or Kubeflow.",
            "How do you manage the infrastructure scaling when your model endpoint receives sudden spikes in traffic?",
            "Walk me through implementing A/B testing for machine learning models in production.",
            "How do you handle model rollback when a newly deployed model performs worse than the previous version?",
            "Tell me about your experience with GPU resource management and optimization.",
            "How do you implement automated data quality checks in your ML pipelines?",
            "Can you explain how you'd set up comprehensive model monitoring — performance, fairness, and data quality?",
            "What's your approach to managing ML pipeline dependencies and ensuring reproducible builds?",
            "How do you handle secrets and credentials in ML pipeline configurations?",
        ],
        "advanced": [
            "Walk me through the architecture of a fully automated model retraining and deployment pipeline.",
            "How do you handle A/B testing or shadow deployments for evaluating new machine learning models in production?",
            "Tell me about a time you had to optimize model serving infrastructure to achieve ultra-low latency.",
            "How do you ensure compliance, governance, and auditability of models deployed in an enterprise environment?",
            "Explain your strategy for managing GPU resources effectively across a large team of data scientists.",
            "How do you design a platform that allows data scientists to deploy models without DevOps knowledge?",
            "Walk me through implementing online learning or streaming model updates in production.",
            "How do you handle multi-model serving — routing different requests to different model versions?",
            "Tell me about your experience with edge deployment — getting ML models running on mobile or IoT devices.",
            "How do you approach cost optimization for ML infrastructure at scale?",
            "Walk me through designing a model marketplace or model-as-a-service platform.",
            "How do you implement comprehensive lineage tracking from raw data to model predictions?",
        ],
    },
    "data_engineer": {
        "beginner": [
            "Can you walk me through the basic steps of building an ETL pipeline?",
            "How do you decide between using a relational database versus a document store for a new dataset?",
            "Tell me about your experience writing complex SQL queries. What are some functions you use frequently?",
            "How do you approach cleaning and transforming messy data before it goes into a warehouse?",
            "What tools do you typically use to schedule and monitor your data jobs?",
            "Can you explain the difference between OLTP and OLAP systems?",
            "How do you handle duplicate records in your data pipelines?",
            "Tell me about your experience with data serialization formats — JSON, Parquet, Avro.",
            "What's your approach to documenting data pipelines and data dictionaries?",
            "How do you handle slowly changing dimensions in your data warehouse?",
            "Can you explain what partitioning is and when you'd use it?",
            "Tell me about a data quality issue you discovered and how you fixed it.",
        ],
        "intermediate": [
            "Walk me through a scenario where you had to optimize a slow-running data pipeline or database query.",
            "How do you design a data warehouse schema? Do you prefer star schema, snowflake, or another approach?",
            "Can you explain the difference between batch processing and stream processing, and when you would use each?",
            "Tell me about your experience with distributed data processing frameworks like Apache Spark.",
            "How do you ensure data quality and handle pipeline failures gracefully?",
            "Walk me through implementing change data capture for real-time data synchronization.",
            "How do you handle schema evolution when upstream data sources change their format?",
            "Tell me about your experience with data orchestration tools like Airflow or Dagster.",
            "How do you approach testing data pipelines — unit tests, integration tests, data validation?",
            "Can you explain how you'd implement exactly-once processing semantics in a streaming pipeline?",
            "How do you handle backfilling historical data when a new pipeline is introduced?",
            "What's your approach to managing data pipeline dependencies and preventing cascade failures?",
        ],
        "advanced": [
            "Walk me through how you would architect a real-time data lakehouse to handle petabytes of data.",
            "How do you approach data governance, security, and access control in a large organization?",
            "Tell me about a time you had to migrate a massive amount of data between different cloud providers or database systems.",
            "How do you design idempotent data pipelines that can recover from complex failure states without duplicating data?",
            "Explain your strategy for optimizing cloud computing costs associated with large-scale data processing.",
            "How do you implement data mesh architecture — domain-oriented data ownership and data products?",
            "Walk me through designing a unified batch and streaming architecture using a framework like Apache Flink.",
            "How do you handle compliance requirements like GDPR right-to-be-forgotten across distributed data systems?",
            "Tell me about your experience with query federation — querying across multiple heterogeneous data sources.",
            "How do you approach capacity planning for data infrastructure that needs to scale 10x over the next year?",
            "Walk me through implementing a data quality framework with automated anomaly detection.",
            "How do you design a self-service data platform that empowers analysts while maintaining governance?",
        ],
    },
    "data_scientist": {
        "beginner": [
            "Walk me through your typical process for exploratory data analysis when you get a brand new dataset.",
            "How do you identify and handle missing values or outliers in your data?",
            "Can you explain the difference between correlation and causation?",
            "Tell me about your approach to creating clear and actionable data visualizations.",
            "What statistical tests do you find yourself using most often in your day-to-day work?",
            "How do you explain the concept of p-values and statistical significance to non-technical people?",
            "Can you walk me through a basic linear regression and how you interpret the coefficients?",
            "Tell me about your experience with Python libraries like pandas, NumPy, and matplotlib.",
            "How do you approach sampling when dealing with very large datasets?",
            "What's the difference between a Type 1 and Type 2 error, and why does it matter?",
            "How do you present data findings to a business audience?",
            "Tell me about a time you used data to influence a business decision.",
        ],
        "intermediate": [
            "Walk me through a time you designed and analyzed an A/B test. How did you determine statistical significance?",
            "How do you approach dimensionality reduction when working with datasets that have hundreds of features?",
            "Tell me about a complex predictive model you built. How did you select the features and validate the results?",
            "How do you handle situations where the data you need to solve a business problem isn't readily available?",
            "Can you explain how you communicate highly technical statistical findings to non-technical stakeholders?",
            "Walk me through your approach to time-series forecasting — what methods and validation techniques do you use?",
            "How do you handle multi-collinearity in your models, and how do you detect it?",
            "Tell me about your experience with Bayesian statistics versus frequentist approaches.",
            "How do you design experiments when randomization isn't possible — quasi-experimental methods?",
            "Can you explain how you approach model selection — balancing complexity with interpretability?",
            "How do you quantify the business impact of your models and analyses?",
            "Tell me about implementing a customer segmentation analysis — methodology and business application.",
        ],
        "advanced": [
            "Walk me through your experience with causal inference techniques to determine the true impact of a business intervention.",
            "How do you design complex experiments when standard A/B testing is not feasible due to network effects or interference?",
            "Tell me about a time you had to use advanced statistical modeling, like Bayesian networks or Markov chains, to solve a problem.",
            "How do you quantify and communicate the uncertainty or confidence intervals of your model predictions?",
            "Explain your strategy for bridging the gap between a prototype analytical model and a scalable production system.",
            "Walk me through implementing a propensity score matching analysis — when is it appropriate and what are its limitations?",
            "How do you handle survival analysis problems — customer churn prediction with censored data?",
            "Tell me about building recommendation systems at scale — algorithmic approaches and evaluation metrics.",
            "How do you approach multi-armed bandit problems as an alternative to traditional A/B testing?",
            "Can you explain your experience with graph analytics or network analysis for business problems?",
            "How do you design fair and unbiased ML models — what techniques do you use to measure and mitigate bias?",
            "Walk me through a scenario where you had to combine multiple data sources with different granularities for analysis.",
        ],
    }
}

def get_questions_for_interview(interview_type, difficulty_level):
    """Get the question bank for the given type and level."""
    type_questions = QUESTION_BANKS.get(interview_type, QUESTION_BANKS["fullstack"])
    return type_questions.get(difficulty_level, type_questions["intermediate"])


# Field-specific interviewer personas and focus areas
INTERVIEWER_PERSONAS = {
    "frontend": {
        "persona": "a Senior Frontend Architect who has built large-scale web applications at companies like Stripe and Vercel",
        "focus": "UI/UX thinking, component architecture, performance optimization, accessibility, and user experience intuition",
        "eval_style": "Pay attention to whether they think about the end user. Do they consider edge cases in the UI? Do they think about responsive design naturally? Evaluate their CSS and JavaScript fundamentals deeply.",
        "red_flags": "Watch for candidates who only know framework APIs but can't explain underlying browser concepts, or those who ignore accessibility and performance.",
    },
    "backend": {
        "persona": "a Principal Backend Engineer who has designed systems handling millions of requests per second at scale",
        "focus": "system design thinking, database expertise, API design principles, error handling philosophy, and scalability awareness",
        "eval_style": "Focus on whether they think about edge cases, failure modes, and data consistency. Do they consider security from the start? Can they reason about system bottlenecks?",
        "red_flags": "Watch for candidates who can't explain the trade-offs of their database choices, or who don't think about error handling and monitoring.",
    },
    "fullstack": {
        "persona": "a Tech Lead who has shipped end-to-end products from zero to millions of users",
        "focus": "end-to-end system thinking, integration patterns, deployment strategies, and the ability to context-switch between frontend and backend concerns",
        "eval_style": "Evaluate their ability to think holistically. Can they trace a user action from the UI through the API to the database? Do they understand how frontend and backend decisions impact each other?",
        "red_flags": "Watch for candidates who are strong on one side but completely weak on the other, or who can't explain how data flows through their applications.",
    },
    "devops": {
        "persona": "a Staff Site Reliability Engineer who has managed production infrastructure for high-traffic systems",
        "focus": "infrastructure automation, reliability engineering, monitoring philosophy, incident response, and cost optimization",
        "eval_style": "Focus on their operational thinking. Do they consider what happens when things fail? Can they explain their monitoring and alerting strategy? Do they think about security and compliance?",
        "red_flags": "Watch for candidates who only know tools but can't explain the principles behind them, or who don't think about failure scenarios and recovery.",
    },
    "ai_ml_engineer": {
        "persona": "a Lead ML Engineer who has deployed production ML systems that serve real-time predictions at scale",
        "focus": "model development lifecycle, data quality awareness, experiment design, production ML challenges, and mathematical foundations",
        "eval_style": "Evaluate their understanding of the full ML lifecycle — not just model training. Do they think about data quality? Can they explain their model choices mathematically? Do they consider production deployment challenges?",
        "red_flags": "Watch for candidates who can only call sklearn APIs but can't explain bias-variance tradeoff, or who never think about how their models will perform on real-world data.",
    },
    "gen_ai_engineer": {
        "persona": "a GenAI Lead who has built production LLM applications including RAG systems, AI agents, and enterprise chatbots",
        "focus": "LLM application architecture, prompt engineering depth, retrieval systems, evaluation methodology, and responsible AI practices",
        "eval_style": "Focus on whether they understand the limitations of LLMs. Can they design robust systems that handle hallucinations? Do they think about evaluation beyond just vibes? Do they consider cost, latency, and safety?",
        "red_flags": "Watch for candidates who only know how to call OpenAI APIs but can't design a robust production system, or who don't think about evaluation and testing.",
    },
    "mlops_engineer": {
        "persona": "a Head of ML Platform who has built internal ML platforms serving hundreds of data scientists",
        "focus": "ML pipeline automation, model monitoring, infrastructure management, reproducibility, and platform thinking",
        "eval_style": "Evaluate their ability to think about the platform holistically. Can they design systems that other data scientists can use? Do they understand model drift and monitoring? Can they manage complex dependencies?",
        "red_flags": "Watch for candidates who only focus on model training but ignore the operational aspects, or who can't explain how they'd handle model rollback or A/B testing.",
    },
    "data_engineer": {
        "persona": "a Principal Data Engineer who has built data platforms processing petabytes of data for analytics and ML",
        "focus": "data pipeline architecture, data quality engineering, performance optimization, schema design, and data governance",
        "eval_style": "Focus on their understanding of data at scale. Do they think about data quality proactively? Can they design efficient pipelines that handle failures gracefully? Do they understand the differences between batch and streaming?",
        "red_flags": "Watch for candidates who can write SQL but can't design data models, or who don't think about data quality, lineage, and governance.",
    },
    "data_scientist": {
        "persona": "a Director of Data Science who has led teams that drove major business decisions through statistical analysis and modeling",
        "focus": "statistical rigor, business impact thinking, experiment design, communication of results, and practical modeling skills",
        "eval_style": "Focus on whether they can connect data to business outcomes. Do they think about statistical validity? Can they design proper experiments? Can they communicate findings clearly to non-technical stakeholders?",
        "red_flags": "Watch for candidates who focus purely on algorithms without understanding the business context, or who can't explain their statistical methodology rigorously.",
    },
}


class InterviewerAgent(Agent):
    def __init__(self, interview_type="fullstack", difficulty_level="intermediate",
                 interview_id=None, user_name="Candidate", max_questions=8,
                 resume_text="", job_description=""):
        self.interview_type = interview_type
        self.difficulty_level = difficulty_level
        self.interview_id = interview_id
        self.user_name = user_name
        self.conversation_log = []
        self.question_count = 0
        self.max_questions = max_questions

        questions = get_questions_for_interview(interview_type, difficulty_level)
        questions_text = json.dumps(questions, indent=2)

        llm = openai.LLM.with_cerebras(model="llama3.1-8b")
        stt = deepgram.STT()
        tts = deepgram.TTS()
        vad = silero.VAD.load()

        # Build context sections for resume and job description
        resume_section = ""
        if resume_text:
            resume_section = f"""

CANDIDATE'S RESUME:
{resume_text}

RESUME-AWARE INSTRUCTIONS:
- You have the candidate's resume above. Use it to personalize the interview significantly.
- Reference specific projects, companies, skills, and experiences from their resume.
- Ask targeted questions about technologies they have listed (e.g., "I see you worked with Kubernetes at Company X — tell me about that").
- Probe gaps or interesting transitions in their career timeline.
- Validate claims by asking for concrete examples and depth on listed skills.
- Compare their stated experience level with their resume to calibrate question difficulty.
- Do NOT read the resume back to them verbatim — use it as context to drive natural, personalized questions."""

        jd_section = ""
        if job_description:
            jd_section = f"""

TARGET JOB DESCRIPTION:
{job_description}

JOB-FOCUSED INSTRUCTIONS:
- The candidate is preparing for the role described above. Tailor your questions to match the job requirements.
- Prioritize topics and technologies mentioned in the job description.
- Ask scenario-based questions relevant to the role's day-to-day responsibilities.
- If the JD mentions specific tools, frameworks, or methodologies, include questions about them.
- Assess the candidate's fit for the role by probing relevant soft skills (teamwork, leadership, communication) mentioned in the JD.
- Frame questions in the context of the role (e.g., "In this role you'd be leading a team of 5 — how would you handle...")."""

        combined_context = ""
        if resume_text and job_description:
            combined_context = """

RESUME + JOB DESCRIPTION CROSS-ANALYSIS:
- You have BOTH the candidate's resume and the target job description. This is a powerful combination.
- Identify skill gaps: Where the JD requires skills not evident in the resume, ask questions to discover hidden competencies.
- Identify strengths: Where the resume strongly matches JD requirements, ask deeper questions to confirm expertise depth.
- Assess transferability: For experiences not directly matching the JD, explore how those skills translate to the target role.
- Focus 60% of questions on JD-relevant topics, 30% on resume-specific deep-dives, and 10% on general behavioral questions."""

        # Get field-specific persona
        persona_data = INTERVIEWER_PERSONAS.get(interview_type, INTERVIEWER_PERSONAS["fullstack"])

        instructions = f"""You are {persona_data['persona']}, conducting a technical interview for IntervuAI. You are NOT a generic AI — you are a domain expert with deep knowledge in {interview_type.replace('_', ' ')} who has real opinions and can challenge candidates meaningfully.

INTERVIEW DETAILS:
- Interview Type: {interview_type.replace('_', ' ').replace('-', ' ').title()}
- Difficulty Level: {difficulty_level.title()}
- Candidate Name: {user_name}

YOUR INTERVIEWER PERSONALITY:
- You have strong opinions about best practices in your field. Share them when relevant.
- You occasionally share brief anecdotes from "your experience" to make the conversation feel real.
- You push back respectfully when an answer is vague or incorrect — don't just accept everything.
- You sound impressed when a candidate gives a genuinely strong answer.
- You're evaluating: {persona_data['focus']}

WHAT YOU'RE LOOKING FOR:
{persona_data['eval_style']}

RED FLAGS TO PROBE:
{persona_data['red_flags']}

TECHNICAL QUESTION BANK (Use as inspiration, not a script — adapt based on the conversation):
{questions_text}
{resume_section}{jd_section}{combined_context}
INTERVIEW FLOW & RULES:
1. OPENING (Question 1): Warm greeting. Introduce yourself briefly with your role. Ask {user_name} to tell you about themselves — what they've been working on recently and what excites them technically.
2. EXPERIENCE DEEP-DIVE (Questions 2-3): Based on what they share, dig into THEIR specific experience. Ask about a project they mentioned. What was the hardest part? What would they do differently? This must feel personalized, not scripted.
3. ADAPTIVE DIFFICULTY: If they answer confidently and correctly, make the next question harder. If they struggle, offer a simpler angle or hint and note it. Never keep asking the same difficulty if the candidate is clearly above or below it.
4. TECHNICAL CORE (Questions 4-{self.max_questions - 2}): Use the question bank as a guide but adapt to the conversation. Create natural bridges like "That reminds me of something I wanted to ask about..." or "Since you mentioned X, how do you handle Y?"
5. CHALLENGE QUESTION (Question {self.max_questions - 1}): Give them one genuinely difficult scenario or design question. Let them think through it. Ask follow-up probing questions on their approach.
6. BEHAVIORAL + WRAP-UP (Question {self.max_questions}): Ask one behavioral question relevant to the role, then conclude warmly. Mention something specific you were impressed by.

CONVERSATIONAL RULES:
- React to every answer before asking the next question. Say things like "That's a really solid approach," or "Hmm, that's one way to do it — have you considered...?" or "I've seen teams struggle with exactly that."
- When a candidate gives a surface-level answer, probe deeper: "Can you walk me through that in more detail?" or "What trade-offs did you consider?"
- When a candidate gives a wrong or weak answer, gently challenge: "That's interesting — though I've seen some issues with that approach. What do you think about...?"
- NEVER just read questions sequentially. The conversation MUST flow naturally.
- Ask exactly ONE question at a time. Ask a total of {self.max_questions} questions.

SPEECH & FORMAT CONSTRAINTS:
- You are speaking via TTS. Absolutely NO markdown, bullet points, numbered lists, or code blocks.
- Keep each response under 25 seconds of speaking time — be concise and conversational.
- Use natural speech patterns — contractions, occasional pauses indicated by commas, and conversational tone.

CONCLUSION:
- Wrap up by mentioning one specific strength and one area to explore further.
- Tell them their detailed feedback with scores will be available on their dashboard shortly."""

        super().__init__(
            instructions=instructions,
            stt=stt, llm=llm, tts=tts, vad=vad
        )

    async def on_enter(self):
        self.session.generate_reply(
            user_input=f"Start the interview. Give a short friendly greeting, introduce yourself as the AI interviewer from IntervuAI for a {self.difficulty_level} level {self.interview_type} interview, and ask {self.user_name} to introduce themselves."
        )


async def save_interview_results(interview_id, transcript_data, backend_url, api_key):
    """Post interview results back to the Node.js backend."""
    if not interview_id or not backend_url:
        print("No interview ID or backend URL, skipping save.")
        return

    url = f"{backend_url}/api/interview/{interview_id}/save-live-results"
    headers = {
        "Content-Type": "application/json",
        "x-agent-api-key": api_key or "",
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=transcript_data, headers=headers) as resp:
                if resp.status == 200:
                    print(f"Interview results saved for {interview_id}")
                else:
                    text = await resp.text()
                    print(f"Failed to save results: {resp.status} - {text}")
    except Exception as e:
        print(f"Error saving interview results: {e}")


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    room = ctx.room
    metadata = {}

    # 1) Try room-level metadata first
    try:
        if room.metadata:
            metadata = json.loads(room.metadata)
    except (json.JSONDecodeError, TypeError):
        pass

    # 2) Fallback: read participant metadata (backend sets it on the user token)
    if not metadata:
        for participant in room.remote_participants.values():
            try:
                if participant.metadata:
                    metadata = json.loads(participant.metadata)
                    break
            except (json.JSONDecodeError, TypeError):
                continue

    # 3) If still empty, wait briefly for a participant to connect with metadata
    if not metadata:
        for _ in range(30):  # up to 15 seconds
            await asyncio.sleep(0.5)
            for participant in room.remote_participants.values():
                try:
                    if participant.metadata:
                        metadata = json.loads(participant.metadata)
                        break
                except (json.JSONDecodeError, TypeError):
                    continue
            if metadata:
                break

    interview_type = metadata.get("interviewType", "fullstack")
    difficulty_level = metadata.get("difficultyLevel", "intermediate")
    interview_id = metadata.get("interviewId", None)
    user_name = metadata.get("userName", "Candidate")
    max_questions = metadata.get("maxQuestions", 8)
    resume_text = metadata.get("resumeText", "")
    job_description = metadata.get("jobDescription", "")

    print(f"Starting interview: type={interview_type}, level={difficulty_level}, id={interview_id}, resume={'yes' if resume_text else 'no'}, jd={'yes' if job_description else 'no'}")

    agent = InterviewerAgent(
        interview_type=interview_type,
        difficulty_level=difficulty_level,
        interview_id=interview_id,
        user_name=user_name,
        max_questions=max_questions,
        resume_text=resume_text,
        job_description=job_description,
    )

    session = AgentSession()

    # Collect transcript for saving
    transcript_entries = []

    @session.on("agent_speech_committed")
    def on_agent_speech(msg):
        transcript_entries.append({
            "role": "interviewer",
            "text": msg.content if hasattr(msg, 'content') else str(msg),
            "timestamp": asyncio.get_event_loop().time(),
        })

    @session.on("user_speech_committed")
    def on_user_speech(msg):
        transcript_entries.append({
            "role": "candidate",
            "text": msg.content if hasattr(msg, 'content') else str(msg),
            "timestamp": asyncio.get_event_loop().time(),
        })

    await session.start(room=room, agent=agent)

    # Wait for participant to disconnect or timeout (20 min max)
    try:
        await asyncio.sleep(1200)  # 20 min max
    except asyncio.CancelledError:
        pass

    # Save results when session ends
    backend_url = os.environ.get("BACKEND_URL", "http://localhost:3000")
    agent_api_key = os.environ.get("AGENT_API_KEY", "")

    if interview_id and transcript_entries:
        await save_interview_results(
            interview_id,
            {
                "transcript": transcript_entries,
                "interviewType": interview_type,
                "difficultyLevel": difficulty_level,
            },
            backend_url,
            agent_api_key,
        )


if __name__ == "__main__":
    check_environment_vars()
    opts = WorkerOptions(entrypoint_fnc=entrypoint)
    print("Starting IntervuAI Agent Worker...")
    agents.cli.run_app(opts)
