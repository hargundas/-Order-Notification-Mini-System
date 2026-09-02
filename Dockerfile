# Multi-stage build using official Maven with Java 21 (No wrapper script dependency)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml and source files
COPY backend/pom.xml ./
COPY backend/src ./src

# Build production executable JAR
RUN mvn clean package -DskipTests

# Stage 2: Ultra-lightweight JRE 21 Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
