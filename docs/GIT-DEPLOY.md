# Git — credenciales de despliegue (imcyc-precios)

Este servidor usa una **clave SSH dedicada** solo para el repositorio `DavidGC026/imcyc-precios`. No comparte credenciales con otros proyectos.

## Ubicación de la clave

| Archivo | Uso |
|---------|-----|
| `/var/www/sources/git/imcyc-precios-github` | Clave privada (permiso 600, no subir a Git) |
| `/var/www/sources/git/imcyc-precios-github.pub` | Clave pública (registrar en GitHub) |

## Configurar en el servidor

```bash
bash /home/sistemas/Programas/imcyc-precios/scripts/git-configure.sh
```

## Registrar en GitHub (una vez)

1. Abre https://github.com/DavidGC026/imcyc-precios/settings/keys
2. **Add deploy key**
3. Título: `grabador-imcyc-precios`
4. Pega el contenido de `imcyc-precios-github.pub`
5. Marca **Allow write access** (necesario para `git push`)

## Push desde el servidor

```bash
cd /home/sistemas/Programas/imcyc-precios
git push origin main
```

## Qué queda configurado (solo este repo)

- `user.name`: IMCYC Precios Deploy
- `user.email`: sistemas@imcyc.com
- `origin`: `git@github.com:DavidGC026/imcyc-precios.git`
- `core.sshCommand`: usa la clave en `/var/www/sources/git/`
