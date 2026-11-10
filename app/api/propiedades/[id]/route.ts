import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { leerJson, idValido, idInvalido } from '@/lib/api';
import { validarPropiedad, booleano } from '@/lib/propiedades';

export const dynamic = 'force-dynamic';

// Edición de propiedad (validada y normalizada con validarPropiedad)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idValido(params.id);
    if (!id) return idInvalido();
    const j = await leerJson(req);
    if (!j.ok) return j.res;
    const v = validarPropiedad(j.body);
    if (!v.ok) return NextResponse.json({ error: 'Revisá los datos de la propiedad', errores: v.errores }, { status: 400 });
    const p = v.data;

    const { rowCount } = await pool.query(
      `UPDATE public.propiedades SET
         titulo=$1, descripcion=$2, tipo=$3, operacion=$4, precio=$5, moneda=$6,
         ambientes=$7, dormitorios=$8, banos=$9, superficie_m2=$10, piso=$11,
         direccion=$12, barrio=$13, ciudad=$14, caracteristicas=$15, expensas=$16,
         requisitos_garantia=$17, disponible=$18, destacado=$19,
         codigo_aviso=$20, url_publica=$21, imagen_principal=$22, imagenes=$23, actualizado_en=now()
       WHERE id=$24`,
      [
        p.titulo, p.descripcion, p.tipo, p.operacion, p.precio, p.moneda,
        p.ambientes, p.dormitorios, p.banos, p.superficie_m2, p.piso,
        p.direccion, p.barrio, p.ciudad, p.caracteristicas, p.expensas, p.requisitos_garantia,
        p.disponible, p.destacado, p.codigo_aviso, p.url_publica, p.imagen_principal, p.imagenes,
        id,
      ]
    );
    if (!rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error editando propiedad:', err);
    return NextResponse.json({ error: 'No se pudo editar la propiedad' }, { status: 500 });
  }
}

// HU-05: marcar disponible / no disponible en un clic
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idValido(params.id);
    if (!id) return idInvalido();
    const j = await leerJson(req);
    if (!j.ok) return j.res;
    // Obligatorio y booleano estricto: "no", 0 o ausente no se interpretan como true/false.
    const disponible = j.body.disponible === undefined ? undefined : booleano(j.body.disponible, true);
    if (disponible === undefined) {
      return NextResponse.json({ error: 'Revisá los datos', errores: { disponible: 'Tiene que ser verdadero o falso' } }, { status: 400 });
    }
    const { rowCount } = await pool.query(
      `UPDATE public.propiedades SET disponible=$1, actualizado_en=now() WHERE id=$2`,
      [disponible, id]
    );
    if (!rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json({ ok: true, disponible });
  } catch (err) {
    console.error('Error cambiando disponibilidad:', err);
    return NextResponse.json({ error: 'No se pudo cambiar el estado' }, { status: 500 });
  }
}
