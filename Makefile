UID := $(shell id -u)
ROOTLESS_SOCK := /run/user/$(UID)/docker.sock
DOCKER_HOST_ADDR := $(if $(wildcard $(ROOTLESS_SOCK)),unix://$(ROOTLESS_SOCK),unix:///var/run/docker.sock)
DOCKER := DOCKER_HOST=$(DOCKER_HOST_ADDR) docker

run:
	./mvnw spring-boot:run 
db:      
	@$(DOCKER) info >/dev/null 2>&1 || { \
		echo "Docker daemon is not reachable."; \
		echo "Try no-sudo rootless Docker:"; \
		echo "  systemctl --user start docker"; \
		echo "If DOCKER_HOST is set incorrectly, run:"; \
		echo "  unset DOCKER_HOST"; \
		exit 1; \
	}
	@$(DOCKER) rm -f 01blogdb >/dev/null 2>&1 || true
	$(DOCKER) run --name 01blogdb \
  	-e POSTGRES_USER=midbenke \
  	-e POSTGRES_PASSWORD=123456 \
  	-e POSTGRES_DB=blogdb \
  	-p 5432:5432 \
  	-d postgres:15
db_bash:
	$(DOCKER) exec -it 01blogdb bash 
admin:
	./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8081 --admin"
start_db:
	$(DOCKER) start 01blogdb
clean:
	./mvnw clean
build:
	./mvnw clean package -
dependency-update:
	./mvnw versions:use-latest-releases
