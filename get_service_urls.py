import json
import sys


services_path =  sys.argv[1]
public_ip = sys.argv[2]
fObj = open(services_path, )
services = json.load(fObj)
urls= []
for service in services:
    if 'ports' in service:
        ports = service['ports']
        for port in ports:
            if port['PublishMode'] == 'ingress':
                schema = 'http://'
                url = schema+public_ip+':'+str(port['PublishedPort'])
                urls.append(url)

print(json.dumps(urls))
