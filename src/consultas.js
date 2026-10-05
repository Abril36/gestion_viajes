// =============================================================================
// SCRIPT DE CONSULTAS MQL Y OPERACIONES CRUD - TRANSPORTE
// Base de datos: gestion_viajes | Colección: viajes
// =============================================================================

use gestion_viajes;

// -----------------------------------------------------------------------------
// PASO 3: CONSULTAS DE LECTURA CRÍTICAS (READ)
// -----------------------------------------------------------------------------

// 1. Filtrado básico por coincidencia exacta
// Problema de negocio: Consultar todos los viajes realizados por el chofer "Juan Carlos Pérez".
db.viajes.find({
  "chofer": "Juan Carlos Pérez"
});

// 2. Operadores de comparación (\(gt,\)lt, $in)
// Problema de negocio: Buscar viajes donde se cargaron más de 300 litros de combustible en cuenta corriente.
db.viajes.find({
  "gastosCuentaCorriente.litros": { $gt: 300 }
});

// 3. Acceso a propiedades dentro de objetos anidados (Dot Notation)
// Problema de negocio: Filtrar los viajes que tienen como destino la ciudad de "Santiago de Chile".
db.viajes.find({
  "ruta.destino": "Santiago de Chile"
});

// 4. Proyección de campos específica (excluyendo _id)
// Problema de negocio: Obtener un reporte rápido de viajes finalizados mostrando chofer, camión y remito omitiendo el _id.
db.viajes.find(
  { "estado": "Finalizado" },
  { "_id": 0, "chofer": 1, "camion": 1, "documentacion.remito": 1 }
);

// 5. Filtro en elementos de arreglo con operadores ($elemMatch)
// Problema de negocio: Buscar viajes con gastos en cuenta corriente realizados en "YPF Uspallata" con importe superior o igual a $350.000.
db.viajes.find({
  "gastosCuentaCorriente": {
    $elemMatch: {
      "estacionServicio": "YPF Uspallata",
      "importe": { $gte: 350000 }
    }
  }
});

// -----------------------------------------------------------------------------
// PASO 4: ACTUALIZACIONES ATÓMICAS (UPDATE & DELETE)
// -----------------------------------------------------------------------------

// 1. Modificar un campo simple y añadir una nueva propiedad ($set)
// Problema de negocio: Registrar fecha de descarga y observaciones en un viaje que estaba "En Tránsito" pasándolo a "Finalizado".
db.viajes.updateOne(
  { "_id": ObjectId("650c1f1e1a2b3c4d5e6f8a04") },
  {
    $set: {
      "estado": "Finalizado",
      "fechas.descarga": ISODate("2024-03-13T16:00:00Z"),
      "observaciones": "Entrega realizada sin novedades"
    }
  }
);

// 2. Actualización atómica que incrementa/decrementa un contador ($inc)
// Problema de negocio: Ajustar los kilómetros de llegada sumando 150 km adicionales por un desvío operacional.
db.viajes.updateOne(
  { "_id": ObjectId("650c1f1e1a2b3c4d5e6f8a01") },
  {
    $inc: { "kilometros.llegada": 150 }
  }
);

// 3. Operación de eliminación segura (deleteOne) bajo criterio estricto
// Problema de negocio: Eliminar un registro duplicado o ingresado por error bajo criterios estrictos de validación.
db.viajes.deleteOne({
  "_id": ObjectId("650c1f1e1a2b3c4d5e6f8a04"),
  "documentacion.remito": "R-0001-00085530",
  "estado": "Finalizado"
});