# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first to speed up subsequent builds
RUN mvn dependency:go-offline -q

COPY src ./src
# Build the application, skipping tests to speed up the deployment
RUN mvn clean package -DskipTests -q

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copy the built jar file from the build stage
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Production JVM flags: container-aware memory limits, minimise footprint
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar"]
