# Prueba-tecnica-programacion-Logixsoft

# Simulador de Logística y Entregas (Prueba Técnica)

Una solución full-stack diseñada como gestor de puntos de entrega. Permite a los usuarios simular ubicaciones, ajustar coordenadas mediante pines en un mapa interactivo (con geocodificación inversa) y gestionar el historial de rutas de forma robusta y segura.

## El Stack Tecnológico y el "Por Qué"

Para esta prueba se optó por una arquitectura separada (Frontend/Backend) utilizando tecnologías modernas, escalables y orientadas a entornos empresariales:

- **Frontend (React 18 + Vite + Tailwind CSS):** Se eligió React por su capacidad para manejar interfaces interactivas complejas (como el mapa) mediante estados. `react-leaflet` permite renderizar el mapa sin depender de costosas API Keys, ideal para este MVP.
- **Backend (Node.js 22 + Express):** Proporciona una API RESTful rápida y asíncrona. Maneja toda la lógica de validación, autorización y comunicación con la base de datos, manteniendo el frontend ligero y seguro.
- **Base de Datos (PostgreSQL):** Aunque era opcional, se implementó una base de datos relacional robusta para asegurar la integridad de los datos (usuarios, pedidos, coordenadas).
- **Infraestructura (Docker + Docker Compose):** Todo el entorno está contenerizado. Esto elimina el problema de "funciona en mi máquina" y demuestra buenas prácticas de despliegue (DevOps).

## Características Principales y Seguridad

- **Autenticación Segura:** Sistema de Login/Registro con contraseñas almacenadas con hash (`bcryptjs`), nunca en texto plano.
- **Rutas Protegidas por JWT (Backend):** Los endpoints de pedidos requieren token Bearer valido y se verifican en middleware.
- **Acceso protegido en Frontend:** La vista de dashboard se habilita con sesion activa (token en cliente) y el control definitivo se aplica en backend.
- **Interactividad Geoespacial:** Marcadores arrastrables con restriccion en interfaz para mantenerse dentro del territorio de El Salvador.
- **Reverse Geocoding:** Al soltar un marcador, la app se comunica con la API de Nominatim para traducir las coordenadas en direcciones de calles reales.
- **Protección contra Ataques:** Backend securizado con `helmet` (cabeceras HTTP) y `express-rate-limit` para mitigar fuerza bruta en `/api/auth/login`.

---

## 🚀 Guía de Instalación y Ejecución

La forma más rápida y recomendada de levantar esta aplicación es utilizando **Docker**. No necesitas instalar Node ni configurar bases de datos locales.

### Requisitos previos

- Tener instalado [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine + Docker Compose).

### Pasos para levantar el entorno

1. Clona este repositorio y navega a la carpeta raíz:
   ```bash
   git clone <https://github.com/Henri-Funes/Prueba-tecnica-programacion-Logixsoft>
   cd <Prueba-tecnica-programacion-Logixsoft>
   ```
2. Ejecuta el siguiente comando para construir y levantar todos los servicios:

   ```bash
   docker compose up -d --build
   ```

3. Puedes acceder a los siguientes servicios en tu navegador:
   - Frontend (La Aplicación): http://localhost:5173
   - Backend (API Base): http://localhost:4000/api/health
   - pgAdmin (Gestor de BD opcional): http://localhost:5050
     - _User:_ `admin@logixsoft.com`
     - _Password:_ `admin123`
     - _(Para conectar el server DB interno en pgAdmin usa host `postgres` y usuario/pass `logixsoft_user` / `logixsoft_pass`)_

### Flujo sugerido para probar la aplicación

1. **Registro:** Entra a la app y crea un usuario nuevo.
2. **Dashboard:** Al iniciar sesión, verás el mapa. Haz clic en el botón de ayuda (❔) para ver las instrucciones interactivas.
3. **Simular y Arrastrar:** Simula un pedido. Verás marcadores de origen (Punto A) y destino (Punto B). Arrástralos hacia otras calles y observa cómo el panel lateral actualiza inmediatamente la dirección en texto real gracias a Leaflet.
4. **Acciones del Pedido:** Una vez iniciada la simulación, en el panel lateral verás tres botones clave:
   - **Guardar:** Persiste el pedido en la base de datos (PostgreSQL vía API), moviéndolo al historial con estado "guardado".
   - **Entregar:** Finaliza el ciclo del pedido, marcándolo como completado en el sistema y guardándolo.
   - **Cancelar:** Descarta la simulación actual y limpia el mapa para empezar de nuevo.
5. **Historial de Pedidos:** Puedes realizar múltiples simulaciones consecutivas. Todos los pedidos guardados o entregados se registrarán y organizarán bajo la fecha de hoy en el panel de historial.

---

## 📦 Estructura del Proyecto

```text
raiz-del-proyecto/
┣ 📂 backend # API en Node/Express, lógica de negocio y seguridad
┃ ┣ 📂 src # Controladores, Servicios, Repositorios y Middlewares (JWT)
┃ ┣ 📜 Dockerfile # Imagen de Node 22 Alpine para producción
┃ ┗ 📜 package.json
┣ 📂 frontend # SPA en React, gestión del estado y mapa interactivo
┃ ┣ 📂 src # Componentes, Hooks, Vistas y llamadas a la API
┃ ┣ 📜 Dockerfile # Build multi-stage publicado en Nginx Alpine
┃ ┗ 📜 nginx.conf # Configuración de rutas para SPA
┣ 📂 bd # Archivos de inicialización de la base de datos
┃ ┗ 📜 schema.sql # Tablas (usuarios, pedidos) e índices
┗ 📜 docker-compose.yml # Orquestador central de la infraestructura
```

> **Nota sobre seguridad y repositorios:** En un entorno corporativo de producción real, los archivos `docker-compose.yml` y variables de entorno (`.env`) no se hacen públicos, sino que se inyectan mediante pipelines de CI/CD o bóvedas de secretos. Para efectos puramente de esta **prueba técnica y evaluación**, se han incluido en el repositorio para facilitar levantar todo localmente con un solo comando.

Anexos
