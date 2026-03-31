"use client";
import RoadmapDashboard from "./roadmap-dashboard";
 
export default function Roadmap({ data, handleDownload, handleGenerateNew }: { data: any ,handleDownload: () => void, handleGenerateNew: () => void}) {
  return (
    <div className="min-h-screen mt-20 bg-card h-full text-foreground dark">
      <RoadmapDashboard data={data} handleDownload={handleDownload} handleGenerateNew={handleGenerateNew} />
    </div>
  );
}

const s = {
  "title":"Job title",
  "1. Job Role Overview":
    "A Java Developer specializes in designing, implementing, and maintaining Java-based applications, primarily focusing on backend development with skills in frameworks like Spring Boot and frontend integration with technologies like React.js.",
  "2. Skills Breakdown": {
    java: "Core programming language used for backend development, emphasizing object-oriented programming, Java SE, Java EE, and JVM internals.",
    springboot:
      "A Java-based framework for building scalable, production-grade web applications rapidly with features like dependency injection, security, and RESTful API development.",
    backend:
      "Designing server-side logic, database integration, API development, and ensuring application performance and security.",
    "react.js":
      "A JavaScript library for building interactive and component-based user interfaces, facilitating seamless frontend and backend integration.",
  },
  "3. Month-by-Month Roadmap": {
    "Month 1": {
      Topics: [
        "Java Fundamentals",
        "Object-Oriented Programming",
        "Java Collections",
        "Basic Java I/O",
      ],
      Resources: [
        "Java Programming and Software Engineering Fundamentals by Duke University (Coursera)",
      ],
      Tasks: [
        "Complete Java basics tutorials",
        "Write simple programs to reinforce OOP concepts",
      ],
    },
    "Month 2": {
      Topics: [
        "Advanced Java",
        "Multithreading",
        "Java Streams",
        "Error Handling",
      ],
      Resources: [
        "Java Concurrency in Practice by Brian Goetz",
        "Oracle Java Documentation",
      ],
      Tasks: [
        "Implement multithreaded applications",
        "Practice exception handling",
      ],
    },
    "Month 3": {
      Topics: [
        "Spring Boot Fundamentals",
        "REST API Development",
        "Spring Data JPA",
        "Security Basics",
      ],
      Resources: [
        "Spring Boot in Action by Craig Walls",
        "Official Spring Boot Documentation",
      ],
      Tasks: ["Build a simple REST API", "Connect API to a database"],
    },
    "Month 4": {
      Topics: [
        "Advanced Spring Boot",
        "Testing & Debugging",
        "Deployment",
        "Microservices",
      ],
      Resources: [
        "Developing Microservices with Spring Boot and Spring Cloud by Juergen Hoeller",
        "Pluralsight Spring Boot Courses",
      ],
      Tasks: [
        "Create microservice architecture",
        "Write unit and integration tests",
      ],
    },
    "Month 5": {
      Topics: [
        "React.js Basics",
        "Component Design",
        "State Management",
        "React Hooks",
      ],
      Resources: [
        "The Road to React by Robin Wieruch",
        "React Official Documentation",
      ],
      Tasks: [
        "Build a React frontend",
        "Connect React app with Spring Boot backend",
      ],
    },
    "Month 6": {
      Topics: [
        "Full-stack Integration",
        "Deployment & DevOps",
        "Code Optimization",
        "Final Project",
      ],
      Resources: [
        "Full Stack Open by University of Helsinki",
        "Docker and Kubernetes Tutorials",
      ],
      Tasks: ["Deploy full-stack application", "Optimize code performance"],
    },
  },
  "4. Learning Resources": {
    Books: [
      "Effective Java by Joshua Bloch",
      "Spring in Action by Craig Walls",
      "React - Up & Running by Stoyan Stefanov",
    ],
    "Online Courses": [
      "Java Programming and Software Engineering Fundamentals (Coursera)",
      "Spring Framework Master Class (Udemy)",
      "React - The Complete Guide (Udemy)",
    ],
    Documentation: [
      "Oracle Java Documentation",
      "Spring Boot Official Documentation",
      "React.js Official Documentation",
    ],
    "Youtube Tutorials": [
      "Java Tutorial for Beginners by Programming with Mosh",
      "Spring Boot Tutorial for Beginners by Amigoscode",
      "React JS Crash Course by Traversy Media",
    ],
  },
  "5. Capstone Project": {
    "Project Idea":
      "Develop a full-stack e-commerce application with Java Spring Boot backend and React.js frontend.",
    Features: [
      "User authentication",
      "Product catalog",
      "Shopping cart",
      "Order management",
      "Admin dashboard",
    ],
    Technologies: ["Java", "Spring Boot", "React.js", "MySQL", "Docker"],
  },
  "6. Extra Tips": {
    Community:
      "Join Java, Spring Boot, and React developer forums and GitHub communities",
    Practice:
      "Contribute to open-source projects and participate in coding challenges",
    Networking: "Attend local tech meetups, webinars, and tech conferences",
  },
};
