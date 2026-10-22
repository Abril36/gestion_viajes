Proyecto: Gestion de vaije Transporte FT - Documentación Técnica
Desarrollo: Fase 3 - Resiliencia, Transacciones y Securización

Repositorio oficial del sistema de gestión de viajes y logística para la empresa Transporte FT. Este documento detalla la arquitectura de alta disponibilidad, el manejo de transacciones atómicas y las políticas de seguridad implementadas.

1. Diagrama de Arquitectura
El sistema se encuentra soportado sobre una infraestructura distribuida diseñada para garantizar tolerancia a fallos y persistencia de datos:
<img width="338" height="357" alt="Captura de pantalla 2026-10-21 192230" src="https://github.com/user-attachments/assets/0c2bf5ee-803f-417f-93dd-d9527b5f16ad" />

° Primary: Nodo encargado de recibir y procesar todas las operaciones de escritura y lectura prioritarias.
° Secondary: Nodo de respaldo que mantiene una copia sincronizada de los datos mediante Oplog Replay.
° Arbiter: Nodo liviano sin almacenamiento de datos dedicado exclusivamente a emitir un voto en las elecciones de liderazgo ante la caída del nodo primario.

<img width="676" height="561" alt="Captura de pantalla 2026-10-21 010803" src="https://github.com/user-attachments/assets/ad980510-4683-4392-94c1-9d647e19ae3c" />
<img width="672" height="185" alt="Captura de pantalla 2026-10-21 011110" src="https://github.com/user-attachments/assets/264be66b-efb4-46c9-801a-406996dac288" />
<img width="683" height="578" alt="Captura de pantalla 2026-10-21 011323" src="https://github.com/user-attachments/assets/b759d792-a879-4933-af3b-221efa6a994b" />
<img width="1022" height="508" alt="Captura de pantalla 2026-10-21 011346" src="https://github.com/user-attachments/assets/d2c7b929-4342-4d5c-ad53-ccc8ce148604" />
<img width="563" height="538" alt="Captura de pantalla 2026-10-21 011410" src="https://github.com/user-attachments/assets/e38e35f7-c617-4756-8dc9-3918aaccf235" />
1- Caída del Primario: Simulación de interrupción del servicio en el nodo principal (Primary).
2- Elección y Votación: El nodo Arbiter interviene en conjunto con el Secondary para alcanzar el cuórum necesario.
3- Asunción del Nuevo Primario: El nodo secundario es promovido automáticamente a Primary, garantizando la continuidad operativa sin pérdida de integridad.
3. Código de la Transacción (Atomicidad)
El siguiente script implementa el manejo de sesiones y transacciones multi-documento para garantizar la atomicidad (ACID) en la asignación de viajes:

<img width="678" height="248" alt="Captura de pantalla 2026-10-21 160912" src="https://github.com/user-attachments/assets/45660289-1568-4674-bdbd-a5553641c03d" />
<img width="687" height="270" alt="Captura de pantalla 2026-10-21 150218" src="https://github.com/user-attachments/assets/bee4cc2e-afeb-44c6-a469-cee756c151cd" />

```json
// /scripts/transaccion_viaje.js

// 1. Caso de Éxito (Commit)
const s = db.getMongo().startSession();
s.startTransaction();

try {
  const c = s.getDatabase("dbViajesPrueba").camiones;
  const b = s.getDatabase("dbViajesPrueba").bitacoras;

  // Actualizar estado del camión
  const r = c.updateOne(
    { camionId: "CAM-99", estado: "Disponible" },
    { $set: { estado: "En Ruta" } }
  );

  if (r.modifiedCount === 0) {
    throw new Error("No disponible");
  }

  // Registrar bitácora de viaje
  b.insertOne({
    viajeId: "VIAJE-888",
    camionId: "CAM-99",
    chofer: "Roberto",
    destino: "Córdoba"
  });

  s.commitTransaction();
  print("✅ Transaccion EXITOSA: Commit realizado.");
} catch (e) {
  s.abortTransaction();
  print("❌ Rollback: " + e.message);
} finally {
  s.endSession();
}
````

4. Reporte de Securización (Security by Design)
Para mitigar vulnerabilidades históricas asociadas a accesos anónimos y ataques de ransomware en bases de datos expuestas, se implementó una estrategia de endurecimiento (Hardening):
• Habilitación de Autorización: Se configuró el archivo mongod.cfg con la directiva security.authorization: "enabled", obligando al motor a validar credenciales en cada petición.
Roles y Principio de Privilegios Mínimos:
• adminFT (Rol Root): Administrador general con privilegios globales sobre la instancia para tareas de mantenimiento y control.
• appFT (Rol ReadWrite): Usuario exclusivo de la aplicación, restringido únicamente a operaciones de lectura y escritura sobre la base de datos del proyecto (dbViajesPrueba), aislando el entorno operativo.
• Inmunización contra accesos por defecto: Cualquier intento de consulta anónima es blocked de inmediato por el servidor (MongoServerError: requires authentication), garantizando la confidencialidad y control de los activos de Transporte FT.
<img width="662" height="476" alt="Captura de pantalla 2026-10-21 185130" src="https://github.com/user-attachments/assets/15753fed-2f6b-4689-bcb6-7230ea3258a6" />
