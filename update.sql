UPDATE agent SET manifest = CAST(json_set(CAST(manifest AS TEXT), '$.model', 'meta/llama-3.3-70b-instruct') AS BLOB) WHERE name = 'missioncontrol';
