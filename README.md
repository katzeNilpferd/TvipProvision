# Provisioning Service for TVIP Set-Top Boxes

**English** | [Русский](README.ru.md)

The service provides automatic issuance of configuration files
`tvip_provision.xml` for TVIP set-top boxes. It stores devices in the database,
returns default and individual configs. It also provides REST API endpoints and an optional frontend for administration.

## Architecture

The system consists of three containers:

-   **tvip_provision** --- backend service (Python)
-   **postgres** --- database (PostgreSQL)
-   **frontend** *(optional)* --- web management interface (React)

TVIP set-top boxes access via the address:

    https://tvipupdate.net/prov/tvip_provision.xml

To operate the service, replace the DNS domain `tvipupdate.net` with the IP
of your server. After the substitution, requests will be redirected to:

    http://<server_ip>:7373/prov/tvip_provision.xml

## Principle of Operation

1.  The set-top box requests `/prov/tvip_provision.xml`
2.  The backend checks if the device exists in the database
3.  If the device does not exist --- it is created and receives the default config
4.  If it exists, the default/custom config is returned
5.  Through the API or Frontend, you can update the default or individual
    config

## Interaction Diagram

``` mermaid
sequenceDiagram
    participant T as TVIP Set-Top Box
    participant P as Provision Service
    participant D as PostgreSQL
    participant F as Frontend

    Note over T: First access
    T->>P: GET /prov/tvip_provision.xml
    P->>D: Check device
    D-->>P: Not found
    P->>D: Create record
    P->>D: Retrieve default config
    D-->>P: XML configuration
    P-->>T: Return default config

    Note over T: Subsequent requests
    T->>P: GET /prov/tvip_provision.xml
    P->>D: Search for configuration
    D-->>P: Custom/default config
    P-->>T: Return config

    Note over F: Administration
    F->>P: GET /api/devices
    P-->>F: List of devices
    F->>P: PUT /api/default/config/replace
    P->>D: Update default config
    F->>P: PUT /api/devices/{mac}/config/replace
    P->>D: Update device config
    F->>P: POST /api/devices/{mac}/config/reset
    P->>D: Reset config to default
```

## Deployment

To start all services at once:

1.  Create `.env` in the `.frontend/` directory

    - Environment variables can be created based on the example,
		    or left empty.

2.  Deploy docker-compose by running the following command in the root directory:

    ``` bash
    docker-compose --profile frontend up
    ```

3.  Services will be immediately available on the standard ports specified in docker-compose.

    - Backend: `http://localhost:7373`
    - Postgres: `http://localhost:5432`
    - Frontend: `http://localhost:80`


If necessary, services can be launched separately:
 - Only backend: `docker-compose up`,
 - Only frontend: `docker-compose up frontend`
  (Requires specifying the backend address in `.env`),
 - All: `docker-compose --profile frontend up`

## Testing

Partially simulate a set-top box request:

``` bash
curl -H "Mac-Address: 00:11:22:33:44:55" http://127.0.0.1:8000/prov/tvip_provision.xml
```

Replace base configuration:

``` bash
curl -X PUT "http://localhost:7373/api/default/config/replace'" \
  -H "Content-Type: application/json" \
  -d '{
    "provision.@reload": "1800",
    "provision.provision_server.@name": "http://new-server.com/",
    "provision.operator.@name": "NEW_OPERATOR"
  }'
```

### Important Note

Setting or modifying device configuration parameters or default configuration
is done in a `PUT` request, and data must be in `dot notation` format.

Example request body:

``` json
{
"provision.@reload": "86400",
"provision.operator.@name": "xxxxx",
"provision.logo.@url": "xxxxxx",
"provision.time.@tz": "Europe/Moscow",
"provision.time.@ntp": "xxxxx",
"provision.features.mediaplayer.@enabled": "true",
"provision.features.dvr.@enabled": "false",
"provision.features.cctv.@enabled": "false",
"provision.features.vod.@enabled": "false",
"provision.tv_stream.@type": "multicast",
"provision.tv_protocols.@default": "stalker",
"provision.tv_protocols.protocol.@type": "stalker",
"provision.tv_protocols.protocol.@server": "xxxxxx",
"provision.preferences.pref_network_config.@value": "DHCP",
"provision.preferences.pref_tv.pref_tv_streamtype.@visible": "false",
"provision.preferences.pref_tv.pref_tv_udpxyaddress.@visible": "false",
"provision.preferences.pref_tv.pref_tv_middleware.@disabled": "true"
}
```
