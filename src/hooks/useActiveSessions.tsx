import {
	useState,
	useEffect,
	useCallback
} from 'react';
import {
	useSupabaseClient
} from './useSupabaseClient';
import {
	toast
} from 'sonner';
import {
	Database
} from '@/integrations/supabase/types';

type ActiveSession = Database['public']['Tables']['sessoes_ativas']['Row'];
type NewActiveSession = Database['public']['Tables']['sessoes_ativas']['Insert'];
type UpdateActiveSession = Database['public']['Tables']['sessoes_ativas']['Update'];

export function useActiveSessions(clientId ? : number) {
	const supabase = useSupabaseClient();
	const [sessions, setSessions] = useState < ActiveSession[] > ([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState < string | null > (null);

	// Load active sessions from Supabase
	useEffect(() => {
		const loadSessions = async () => {
			if (!clientId) {
				setSessions([]);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				const {
					data,
					error: supabaseError
				} = await supabase
					.from('sessoes_ativas')
					.select('*')
					.eq('id_cliente', clientId)
					.order('inicio', {
						ascending: false
					});

				if (supabaseError) {
					throw supabaseError;
				}

				setSessions(data);
				setError(null);
			} catch (err) {
				setError('Error loading active sessions');
				console.error('Error loading active sessions:', err);
				toast.error('Failed to load active sessions');
			} finally {
				setIsLoading(false);
			}
		};

		loadSessions();
	}, [clientId, supabase]);

	// Add new session
	const addSession = useCallback(async (session: NewActiveSession) => {
		try {
			const {
				data,
				error: insertError
			} = await supabase
				.from('sessoes_ativas')
				.insert([session])
				.select()
				.single();

			if (insertError) {
				throw insertError;
			}

			setSessions(prev => [...prev, data]);
			toast.success('Session added successfully');
		} catch (err) {
			console.error('Error adding session:', err);
			toast.error('Failed to add session');
		}
	}, [supabase]);

	// Update session
	const updateSession = useCallback(async (id: number, updates: UpdateActiveSession) => {
		try {
			const {
				data,
				error: updateError
			} = await supabase
				.from('sessoes_ativas')
				.update(updates)
				.eq('id', id)
				.select()
				.single();

			if (updateError) {
				throw updateError;
			}

			setSessions(prev => prev.map(session =>
				session.id === id ? data : session
			));
			toast.success('Session updated successfully');
		} catch (err) {
			console.error('Error updating session:', err);
			toast.error('Failed to update session');
		}
	}, [supabase]);

	// Delete session
	const deleteSession = useCallback(async (id: number) => {
		try {
			const {
				error: deleteError
			} = await supabase
				.from('sessoes_ativas')
				.delete()
				.eq('id', id);

			if (deleteError) {
				throw deleteError;
			}

			setSessions(prev => prev.filter(session => session.id !== id));
			toast.success('Session deleted successfully');
		} catch (err) {
			console.error('Error deleting session:', err);
			toast.error('Failed to delete session');
		}
	}, [supabase]);

	return {
		sessions,
		isLoading,
		error,
		addSession,
		updateSession,
		deleteSession
	};
} 