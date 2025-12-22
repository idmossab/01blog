run:
	./mvnw spring-boot:run
db:      
	docker rm -f 01blogdb
	docker run --name 01blogdb \
  	-e POSTGRES_USER=midbenke \
  	-e POSTGRES_PASSWORD=123456 \
  	-e POSTGRES_DB=blogdb \
  	-p 5432:5432 \
  	-d postgres:15
db_bash:
	docker exec -it 01blogdb bash 
admin:
	./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8081 --admin"
start_db:
	docker start 01blogdb