import {
	useState,
	useEffect,
	useCallback
} from 'react';
import {
	useSupabaseClient
} from './useSupabaseClient';
import {
	supabaseAnon
} from '@/integrations/supabase/client';
import {
	toast
} from 'sonner';
import {
	LeadCompra,
	LeadCompraStatistics,
	LeadCompraFilters,
	ImportData,
	ImportResult
} from '@/types/lead-compra';

const isRlsError = (err: unknown) => {
	if (!err || typeof err !== 'object') return false;
	const e = err as { code?: string; message?: string };
	return e.code === '42501' || (typeof e.message === 'string' && (
		e.message.toLowerCase().includes('row-level security') ||
		e.message.toLowerCase().includes('violates row-level') ||
		e.message.toLowerCase().includes('permission denied')
	));
};

export const useLeadCompra = () => {
	const supabase = useSupabaseClient();
	const [leads, setLeads] = useState < LeadCompra[] > ([]);
	const [statistics, setStatistics] = useState < LeadCompraStatistics | null > (null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState < string | null > (null);


	const fetchLeads = useCallback(async (filters ? : LeadCompraFilters) => {
		setIsLoading(true);
		setError(null);

		try {
			let query = supabase
				.from('lead_compra')
				.select('*');

			// Aplicar filtros
			if (filters?.tipo && filters.tipo !== 'Todos') {
				query = query.eq('tipo', filters.tipo);
			}

			if (filters?.genero) {
				query = query.eq('genero', filters.genero);
			}

			if (filters?.cidade) {
				query = query.eq('cidade', filters.cidade);
			}

			if (filters?.valorMinimo !== undefined) {
				query = query.gte('valor_pago', filters.valorMinimo);
			}

			if (filters?.valorMaximo !== undefined) {
				query = query.lte('valor_pago', filters.valorMaximo);
			}

			if (filters?.dataInicio) {
				query = query.gte('data_evento', filters.dataInicio);
			}

			if (filters?.dataFim) {
				query = query.lte('data_evento', filters.dataFim);
			}

			if (filters?.origemCampanha) {
				query = query.eq('origem_campanha', filters.origemCampanha);
			}

			// Ordenação
			if (filters?.ordenarPor) {
				const ordem = filters.ordem || 'desc';
				query = query.order(filters.ordenarPor, {
					ascending: ordem === 'asc'
				});
			} else {
				query = query.order('data_evento', {
					ascending: false
				});
			}

			const {
				data,
				error
			} = await query;

			if (error) throw error;

			const sanitizedData = (data || []).map((lead: LeadCompra) => ({
				...lead,
				email: lead.email?.includes('@neurobalance.local') ? '' : lead.email
			}));

			setLeads(sanitizedData);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar leads';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [supabase]);

	const addLead = useCallback(async (leadData: Omit<LeadCompra, 'id' | 'created_at' | 'updated_at'>) => {
		setIsLoading(true);
		try {
			const hasProvidedEmail = !!(leadData.email && leadData.email.trim());
			const emailNormalized = hasProvidedEmail
				? leadData.email!.trim().toLowerCase()
				: `sem-email-${(leadData.telefone || '').replace(/\D/g, '') || Date.now()}@neurobalance.local`;

			const payload: Record<string, unknown> = {
				...leadData,
				email: emailNormalized,
				cidade: leadData.cidade?.trim() || '',
			};

			// landing_status é metadado interno de importação (destino: landing_leads)
			// e não existe na tabela lead_compra
			const landingStatusHint = typeof payload.landing_status === 'string' ? payload.landing_status : undefined;
			delete payload.landing_status;

			const validLeadCompraStatuses = [
				'Iniciou Neurofeedback',
				'Não vai avançar',
				'Vão marcar consulta mais à frente',
				'Vai iniciar NFB mas ainda não marcou primeira consulta',
				'Continuam Neurofeedback',
				'Falta resultados da avaliação',
				'Marcaram avaliação',
				'Começa mais tarde'
			];

			payload.status = (leadData.status && validLeadCompraStatuses.includes(leadData.status))
				? leadData.status
				: 'Marcaram avaliação';

			// Verificar se já existe um lead com este email
			let existingLeadId: string | null = null;
			let existingLeadNome: string | null = null;

			if (hasProvidedEmail) {
				const { data: existing } = await supabase
					.from('lead_compra')
					.select('id, nome')
					.eq('email', emailNormalized)
					.maybeSingle();

				if (existing) {
					existingLeadId = existing.id;
					existingLeadNome = existing.nome;
				}
			}

			let resultData: LeadCompra;

			if (existingLeadId) {
				let { data, error } = await supabase
					.from('lead_compra')
					.update(payload)
					.eq('id', existingLeadId)
					.select()
					.single();

				if (isRlsError(error)) {
					const fb = await supabaseAnon
						.from('lead_compra')
						.update(payload)
						.eq('id', existingLeadId)
						.select()
						.single();
					data = fb.data;
					error = fb.error;
				}

				if (error) throw error;
				resultData = data;
				const sanitized = {
					...resultData,
					email: resultData.email?.includes('@neurobalance.local') ? '' : resultData.email
				};
				setLeads(prev => prev.map(l => l.id === existingLeadId ? sanitized : l));
				toast.success(`Lead existente (${existingLeadNome || 'Registo'}) atualizado com sucesso!`);
				return sanitized;
			} else {
				let { data, error } = await supabase
					.from('lead_compra')
					.insert([payload])
					.select()
					.single();

				if (isRlsError(error)) {
					const fb = await supabaseAnon
						.from('lead_compra')
						.insert([payload])
						.select()
						.single();
					data = fb.data;
					error = fb.error;
				}

				if (error) throw error;
				resultData = data;

				// Sincronizar com landing_leads para o quadro Kanban
				try {
					const statusMapToLanding: Record<string, string> = {
						'Marcaram avaliação': 'Agendou Avaliação',
						'Vão marcar consulta mais à frente': 'Contactado',
						'Falta resultados da avaliação': 'Avaliação Realizada',
						'Iniciou Neurofeedback': 'Iniciou Neurofeedback',
						'Não vai avançar': 'Não Avança',
						'Novo': 'Novo',
						'Contactado': 'Contactado',
						'Agendou Avaliação': 'Agendou Avaliação',
						'Avaliação Realizada': 'Avaliação Realizada',
						'Não Avança': 'Não Avança',
					};
					const rawStatus = landingStatusHint || ((leadData as Record<string, unknown>).status as string);
					const landingStatus = (rawStatus === 'Novo' || !rawStatus)
						? 'Novo'
						: (statusMapToLanding[rawStatus] || statusMapToLanding[resultData.status] || 'Novo');
					const lookupEmail = resultData.email || emailNormalized;
					let { data: existingLanding, error: elErr } = await supabase
						.from('landing_leads')
						.select('id')
						.eq('email', lookupEmail)
						.maybeSingle();

					if (isRlsError(elErr)) {
						const fb = await supabaseAnon
							.from('landing_leads')
							.select('id')
							.eq('email', lookupEmail)
							.maybeSingle();
						existingLanding = fb.data;
					}

					if (existingLanding) {
						let { error: uErr } = await supabase.from('landing_leads').update({
							nome: resultData.nome,
							telefone: resultData.telefone,
							morada: resultData.cidade,
							origem: resultData.origem_campanha || 'Instagram',
							status: landingStatus,
							observacoes: resultData.observacoes || '',
							updated_at: new Date().toISOString()
						}).eq('id', existingLanding.id);
						if (isRlsError(uErr)) {
							await supabaseAnon.from('landing_leads').update({
								nome: resultData.nome,
								telefone: resultData.telefone,
								morada: resultData.cidade,
								origem: resultData.origem_campanha || 'Instagram',
								status: landingStatus,
								observacoes: resultData.observacoes || '',
								updated_at: new Date().toISOString()
							}).eq('id', existingLanding.id);
						}
					} else {
						let { error: iErr } = await supabase.from('landing_leads').insert([{
							nome: resultData.nome,
							email: lookupEmail,
							telefone: resultData.telefone,
							morada: resultData.cidade,
							origem: resultData.origem_campanha || 'Instagram',
							status: landingStatus,
							observacoes: resultData.observacoes || ''
						}]);
						if (isRlsError(iErr)) {
							await supabaseAnon.from('landing_leads').insert([{
								nome: resultData.nome,
								email: lookupEmail,
								telefone: resultData.telefone,
								morada: resultData.cidade,
								origem: resultData.origem_campanha || 'Instagram',
								status: landingStatus,
								observacoes: resultData.observacoes || ''
							}]);
						}
					}
				} catch (syncErr) {
					console.warn('Sync to landing_leads failed (non-blocking):', syncErr);
				}

				const sanitized = {
					...resultData,
					email: resultData.email?.includes('@neurobalance.local') ? '' : resultData.email
				};
				setLeads(prev => [sanitized, ...prev]);
				toast.success('Lead/Compra adicionado com sucesso!');
				return sanitized;
			}
		} catch (err: unknown) {
			const errorObj = err as { code?: string; message?: string } | null;
			console.error('Erro ao adicionar lead:', err);
			let errorMessage = 'Erro ao adicionar lead';
			if (errorObj?.code === '23505' || errorObj?.message?.includes('lead_compra_email_key') || errorObj?.message?.includes('duplicate key')) {
				errorMessage = 'Já existe um registo com este e-mail.';
			} else if (errorObj?.message) {
				errorMessage = errorObj.message;
			}
			toast.error(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [supabase]);

	const updateLead = useCallback(async (id: string, updates: Partial<LeadCompra>) => {
		setIsLoading(true);
		try {
			const payload: Record<string, unknown> = { ...updates };
			if (payload.email !== undefined) {
				const hasProvidedEmail = !!(payload.email && typeof payload.email === 'string' && payload.email.trim());
				payload.email = hasProvidedEmail
					? (payload.email as string).trim().toLowerCase()
					: `sem-email-${(payload.telefone ? String(payload.telefone) : '').replace(/\D/g, '') || Date.now()}@neurobalance.local`;
			}
			if (payload.cidade !== undefined) {
				payload.cidade = typeof payload.cidade === 'string' ? payload.cidade.trim() : '';
			}

			let {
				data,
				error
			} = await supabase
				.from('lead_compra')
				.update(payload)
				.eq('id', id)
				.select()
				.single();

			if (isRlsError(error)) {
				const fb = await supabaseAnon
					.from('lead_compra')
					.update(payload)
					.eq('id', id)
					.select()
					.single();
				data = fb.data;
				error = fb.error;
			}

			if (error) throw error;

			// Sincronizar atualização em landing_leads
			try {
				const statusMapToLanding: Record<string, string> = {
					'Marcaram avaliação': 'Agendou Avaliação',
					'Vão marcar consulta mais à frente': 'Contactado',
					'Falta resultados da avaliação': 'Avaliação Realizada',
					'Iniciou Neurofeedback': 'Iniciou Neurofeedback',
					'Não vai avançar': 'Não Avança',
					'Novo': 'Novo',
					'Contactado': 'Contactado',
					'Agendou Avaliação': 'Agendou Avaliação',
					'Avaliação Realizada': 'Avaliação Realizada',
					'Não Avança': 'Não Avança',
				};

				const searchEmail = (payload.email as string) || data.email;
				const searchPhone = (payload.telefone as string) || data.telefone;
				const landingUpdates: Record<string, unknown> = {
					updated_at: new Date().toISOString()
				};
				if (payload.nome) landingUpdates.nome = payload.nome;
				if (payload.telefone) landingUpdates.telefone = payload.telefone;
				if (payload.cidade !== undefined) landingUpdates.morada = payload.cidade;
				if (payload.origem_campanha) landingUpdates.origem = payload.origem_campanha;
				if (payload.observacoes !== undefined) landingUpdates.observacoes = payload.observacoes;
				if (payload.status) {
					landingUpdates.status = statusMapToLanding[payload.status as string] || 'Novo';
				}

				if (searchEmail && !searchEmail.includes('@neurobalance.local')) {
					let { error: uErr } = await supabase.from('landing_leads').update(landingUpdates).eq('email', searchEmail);
					if (isRlsError(uErr)) {
						await supabaseAnon.from('landing_leads').update(landingUpdates).eq('email', searchEmail);
					}
				} else if (searchPhone) {
					let { error: uErr } = await supabase.from('landing_leads').update(landingUpdates).eq('telefone', searchPhone);
					if (isRlsError(uErr)) {
						await supabaseAnon.from('landing_leads').update(landingUpdates).eq('telefone', searchPhone);
					}
				}
			} catch (syncErr) {
				console.warn('Sync update to landing_leads failed:', syncErr);
			}

			const sanitized = {
				...data,
				email: data.email?.includes('@neurobalance.local') ? '' : data.email
			};

			setLeads(prev => prev.map(lead =>
				lead.id === id ? sanitized : lead
			));
			toast.success('Lead/Compra atualizado com sucesso!');
			return sanitized;
		} catch (err: unknown) {
			const errorObj = err as { code?: string; message?: string } | null;
			console.error('Erro ao atualizar lead:', err);
			let errorMessage = 'Erro ao atualizar lead';
			if (errorObj?.code === '23505' || errorObj?.message?.includes('lead_compra_email_key') || errorObj?.message?.includes('duplicate key')) {
				errorMessage = 'Já existe outro registo com este e-mail.';
			} else if (errorObj?.message) {
				errorMessage = errorObj.message;
			}
			toast.error(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [supabase]);

	const deleteLead = useCallback(async (id: string) => {
		setIsLoading(true);
		try {
			const leadToDelete = leads.find(l => l.id === id);

			let {
				error
			} = await supabase
				.from('lead_compra')
				.delete()
				.eq('id', id);

			if (isRlsError(error)) {
				const fb = await supabaseAnon
					.from('lead_compra')
					.delete()
					.eq('id', id);
				error = fb.error;
			}

			if (error) throw error;

			// Sincronizar exclusão com landing_leads
			if (leadToDelete) {
				try {
					if (leadToDelete.email && !leadToDelete.email.includes('@neurobalance.local')) {
						let { error: dErr } = await supabase.from('landing_leads').delete().eq('email', leadToDelete.email);
						if (isRlsError(dErr)) {
							await supabaseAnon.from('landing_leads').delete().eq('email', leadToDelete.email);
						}
					} else if (leadToDelete.telefone) {
						let { error: dErr } = await supabase.from('landing_leads').delete().eq('telefone', leadToDelete.telefone);
						if (isRlsError(dErr)) {
							await supabaseAnon.from('landing_leads').delete().eq('telefone', leadToDelete.telefone);
						}
					}
				} catch (syncErr) {
					console.warn('Sync delete to landing_leads failed:', syncErr);
				}
			}

			setLeads(prev => prev.filter(lead => lead.id !== id));
			toast.success('Lead/Compra removido com sucesso!');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Erro ao remover lead';
			toast.error(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [supabase]);

	const calculateStatistics = useCallback((leadsList: LeadCompra[]): LeadCompraStatistics => {
		if (leadsList.length === 0) {
			return {
				totalRegistos: 0,
				comprasRegistadas: 0,
				leadsRegistados: 0,
				valorTotalRegistado: 0,
				estatisticasValores: {
					registosComValor: 0,
					media: 0,
					minimo: 0,
					mediana: 0,
					maximo: 0,
				},
				distribuicaoPorGenero: {
					masculino: 0,
					feminino: 0,
					outro: 0,
				},
				distribuicaoPorCidade: {},
				distribuicaoPorMes: {},
				conversaoLeadParaCompra: 0,
			};
		}

		const compras = leadsList.filter(lead => lead.tipo === 'Compra');
		const leadsOnly = leadsList.filter(lead => lead.tipo === 'Lead');
		const valoresComPagamento = leadsList.filter(lead => lead.valor_pago > 0);
		const valores = valoresComPagamento.map(lead => lead.valor_pago).sort((a, b) => a - b);

		// Calcular mediana
		const mediana = valores.length === 0 ? 0 :
			valores.length % 2 === 0 ?
			(valores[valores.length / 2 - 1] + valores[valores.length / 2]) / 2 :
			valores[Math.floor(valores.length / 2)];

		// Distribuição por gênero
		const distribuicaoPorGenero = leadsList.reduce((acc, lead) => {
			const genero = lead.genero.toLowerCase();
			acc[genero as keyof typeof acc] = (acc[genero as keyof typeof acc] || 0) + 1;
			return acc;
		}, {
			masculino: 0,
			feminino: 0,
			outro: 0
		});

		// Distribuição por cidade
		const distribuicaoPorCidade = leadsList.reduce((acc, lead) => {
			acc[lead.cidade] = (acc[lead.cidade] || 0) + 1;
			return acc;
		}, {} as {
			[cidade: string]: number
		});

		// Distribuição por mês
		const distribuicaoPorMes = leadsList.reduce((acc, lead) => {
			const data = new Date(lead.data_evento);
			const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
			acc[mesAno] = (acc[mesAno] || 0) + 1;
			return acc;
		}, {} as {
			[mes: string]: number
		});

		// Taxa de conversão
		const conversaoLeadParaCompra = leadsOnly.length > 0 ?
			(compras.length / (compras.length + leadsOnly.length)) * 100 :
			0;

		return {
			totalRegistos: leadsList.length,
			comprasRegistadas: compras.length,
			leadsRegistados: leadsOnly.length,
			valorTotalRegistado: leadsList.reduce((sum, lead) => sum + lead.valor_pago, 0),
			estatisticasValores: {
				registosComValor: valoresComPagamento.length,
				media: valores.length > 0 ? valores.reduce((sum, val) => sum + val, 0) / valores.length : 0,
				minimo: valores.length > 0 ? Math.min(...valores) : 0,
				mediana: mediana,
				maximo: valores.length > 0 ? Math.max(...valores) : 0,
			},
			distribuicaoPorGenero,
			distribuicaoPorCidade,
			distribuicaoPorMes,
			conversaoLeadParaCompra: Math.round(conversaoLeadParaCompra * 100) / 100,
		};
	}, []);

	const importLeads = useCallback(async (data: ImportData[]): Promise < ImportResult > => {
		setIsLoading(true);
		let sucessos = 0;
		let erros = 0;
		const detalhesErros: string[] = [];
		const dadosImportados: LeadCompra[] = [];

		try {
			for (let i = 0; i < data.length; i++) {
				try {
					const item = data[i];

					// Validar dados
					if (!item.nome || !item.telefone) {
						throw new Error(`Linha ${i + 1}: Campos obrigatórios em falta (nome, telefone)`);
					}

					// Preparar dados para inserção
						const leadData = {
							nome: item.nome.trim(),
							email: item.email ? item.email.trim().toLowerCase() : null,
							telefone: item.telefone.trim(),
						idade: parseInt(item.idade.toString()),
						genero: item.genero as LeadCompra['genero'],
						cidade: item.cidade.trim(),
						valor_pago: parseFloat(item.valor_pago.toString()) || 0,
						data_evento: item.data_evento,
						tipo: item.tipo as LeadCompra['tipo'],
						origem_campanha: item.origem_campanha?.trim() || null,
					};

					// Inserir no banco
					const {
						data: insertedData,
						error
					} = await supabase
						.from('lead_compra')
						.insert([leadData])
						.select()
						.single();

					if (error) throw error;

					dadosImportados.push(insertedData);
					sucessos++;
				} catch (err) {
					erros++;
					detalhesErros.push(
						err instanceof Error ? err.message : `Linha ${i + 1}: Erro desconhecido`
					);
				}
			}

			// Atualizar lista local
			if (dadosImportados.length > 0) {
				setLeads(prev => [...dadosImportados, ...prev]);
				toast.success(`Importação concluída: ${sucessos} sucessos, ${erros} erros`);
			}

			return {
				totalLinhas: data.length,
				sucessos,
				erros,
				detalhesErros,
				dadosImportados,
			};
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Erro na importação';
			toast.error(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [supabase]);

	// Calcular estatísticas sempre que a lista de leads mudar
	useEffect(() => {
		if (leads.length > 0) {
			const stats = calculateStatistics(leads);
			setStatistics(stats);
		}
	}, [leads, calculateStatistics]);

	// Carregar dados iniciais
	useEffect(() => {
		fetchLeads();
	}, [fetchLeads]);

	return {
		leads,
		statistics,
		isLoading,
		error,
		fetchLeads,
		addLead,
		updateLead,
		deleteLead,
		importLeads,
		calculateStatistics,
	};
};
