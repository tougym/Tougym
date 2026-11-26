# TOUGYM — MVP móvil editable

Proyecto Expo / React Native para iOS y Android.

## Incluido
- Marca visual TOUGYM negro y dorado.
- Navegación de cliente: reservar, mis reservas.
- Actividades semanales:
  - Lunes: Fuerza total
  - Martes: Cardio
  - Miércoles: Glúteos y piernas
  - Jueves: Piernas
  - Viernes: Sorpresa
- Sesiones de mañana a las 08:00, 09:00 y 10:00.
- Turno de tarde configurable desde el panel Admin.
- Aforo por sesión y lista de espera local.
- Regla de cancelación de 3 horas (se evalúa contra hora local del dispositivo).
- Panel de demostración para añadir/eliminar sesiones y gestionar clientes/bonos.
- Persistencia local en el dispositivo con AsyncStorage.

## Probar
1. Instalar Node.js LTS.
2. Descomprimir el ZIP.
3. Ejecutar `npm install`.
4. Ejecutar `npx expo start`.
5. Abrir Expo Go en el móvil y escanear el QR.

## Acceso Admin de demostración
PIN: `2468`

Este PIN es únicamente de demostración y NO es seguridad real.

## Importante: límites de este MVP
Los datos se guardan localmente en el dispositivo. No hay todavía cuentas reales, sincronización entre teléfonos, base de datos en la nube, WhatsApp, notificaciones push ni publicación en las tiendas. No lo uses todavía para gestionar reservas reales con alumnos.

## Siguiente fase para producción
- Supabase Auth con roles de cliente y administradora.
- Base de datos central y reservas transaccionales con control de aforo.
- Validación de bonos y política de descuento.
- Lista de espera sincronizada.
- Cancelación con hora oficial de la sesión y zona horaria del gimnasio.
- Panel admin protegido.
- WhatsApp Business API y push.
- Política de privacidad, términos, pruebas y publicación.
