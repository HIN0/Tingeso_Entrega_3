pipeline {
    agent any
    
    environment {
        // --- CONFIGURACIÓN ---
        DOCKER_USER = 'izkybin'
        DOCKER_CRED_ID = 'dockerhub-id'
        
        IMAGE_BACK = "${DOCKER_USER}/toolrent-backend"
        IMAGE_FRONT = "${DOCKER_USER}/toolrent-frontend"
    }

    stages {
        stage('Descargar Código') {
            steps {
                checkout scm
            }
        }

        stage('Test Backend (JUnit)') {
            steps {
                dir('BackCore') {
                    sh 'chmod +x mvnw'
                    sh './mvnw clean package'
                }
            }
        }

        stage('Build & Push Backend') {
            steps {
                dir('BackCore') {
                    script {
                        docker.withRegistry('', DOCKER_CRED_ID) {
                            def app = docker.build("${IMAGE_BACK}:latest")
                            app.push()
                        }
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                dir('CoreBack-frontend') {
                    script {
                        docker.withRegistry('', DOCKER_CRED_ID) {
                            def app = docker.build("${IMAGE_FRONT}:latest")
                            app.push()
                        }
                    }
                }
            }
        }
    }
}