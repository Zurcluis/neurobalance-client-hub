
import { supabase } from '../integrations/supabase/client';

async function syncAllSessions() {
    console.log('Starting session synchronization...');

    // 1. Fetch all clients
    const { data: clients, error: clientsError } = await supabase
        .from('clientes')
        .select('id, numero_sessoes');

    if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        return;
    }

    console.log(`Found ${clients?.length} clients.`);

    for (const client of clients || []) {
        // 2. Fetch all appointments for this client
        const { data: appointments, error: appointmentsError } = await supabase
            .from('agendamentos')
            .select('id, data, estado')
            .eq('id_cliente', client.id);

        if (appointmentsError) {
            console.error(`Error fetching appointments for client ${client.id}:`, appointmentsError);
            continue;
        }

        // 3. Fetch all manual sessions for this client
        const { data: manualSessions, error: manualSessionsError } = await supabase
            .from('sessoes')
            .select('id')
            .eq('id_cliente', client.id);

        if (manualSessionsError) {
            console.error(`Error fetching manual sessions for client ${client.id}:`, manualSessionsError);
            // We ignore this and continue with appointments only if it fails
        }

        // 4. Calculate realized sessions
        const now = new Date();
        const realizedAppointmentsCount = (appointments || []).filter((app: any) => {
            const appDate = new Date(app.data);
            return app.estado === 'realizado' || (app.estado !== 'cancelado' && appDate < now);
        }).length;

        const totalRealizedCount = realizedAppointmentsCount + (manualSessions?.length || 0);

        // 5. Update client if different
        if (totalRealizedCount !== client.numero_sessoes) {
            console.log(`Updating client ${client.id}: ${client.numero_sessoes} -> ${totalRealizedCount}`);
            const { error: updateError } = await supabase
                .from('clientes')
                .update({ numero_sessoes: totalRealizedCount })
                .eq('id', client.id);

            if (updateError) {
                console.error(`Error updating client ${client.id}:`, updateError);
            }
        }
    }

    console.log('Synchronization complete.');
}

// Since we can't easily run this from terminal with the same env, 
// I'll export it and the user can trigger it or I'll temporarily add it to a page.
export { syncAllSessions };
