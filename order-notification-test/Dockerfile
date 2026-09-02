# Multi-stage build for Spring Boot Backend with Java 21
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY backend/.mvn ./backend/.mvn
COPY backend/mvnw backend/pom.xml ./backend/
WORKDIR /app/backend
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

COPY backend/src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/backend/target/*.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
