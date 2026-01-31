# 1. Se una imagen base con Java 17
FROM eclipse-temurin:17-jdk-alpine

# 2. Argumento para el archivo JAR (se genera en target/)
ARG JAR_FILE=target/*.jar

# 3. Copiamos el JAR dentro del contenedor y lo renombramos a app.jar
COPY ${JAR_FILE} app.jar

# 4. Exponemos el puerto 8080 (o el que uses en application.properties)
EXPOSE 8080

# 5. Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "/app.jar"]