import docker
import json
  
client = docker.from_env()
services = []
docker_services = client.services.list()
for docker_service in docker_services:
    service_dict = {}
    service_dict['name'] = docker_service.name
    service_dict['id'] = docker_service.short_id
    service_dict['mode'] = docker_service.attrs['Spec']['Mode']
    service_dict['image'] = docker_service.attrs['Spec']['TaskTemplate']['ContainerSpec']['Image']
    if 'Ports' in docker_service.attrs['Endpoint']:
        service_dict['ports'] = docker_service.attrs['Endpoint']
    services.append(service_dict)

print(json.dumps(services))
