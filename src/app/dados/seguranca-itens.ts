/**
 * Os 35 achados do relatório de segurança (S1–S35), com a situação em 13/out/2026 (branch dv-017-seguranca).
 * Curados à mão a partir de RELATORIO_SEGURANCA.md e do painel de status do HANDOFF; as contagens que
 * as páginas exibem (corrigidos, parciais, ignorados) são derivadas desta lista, não digitadas.
 *
 * `ataques` lista as verificações da bateria Testes-Seguranca/ que reverificam o item a cada rodada.
 */

export type EstadoSeguranca = 'Corrigido' | 'Parcial' | 'Ignorado';
export type PrioridadeOriginal = 'Muito urgente' | 'Urgente' | 'Médio' | 'Não urgente' | 'Sem prioridade' | 'Novo';

export interface ItemSeguranca {
  id: string;
  titulo: string;
  estado: EstadoSeguranca;
  /** Prioridade com que o achado nasceu (revisões de 12 e 13/out/2026). */
  prioridade: PrioridadeOriginal;
  area: 'Sessão e senha' | 'Biometria' | 'Borda e rede' | 'Serviço de ML' | 'Dados e logs' | 'Regras de negócio' | 'Cadeia de suprimentos';
  resumo: string;
  ataques: string;
}

export const ITENS_SEGURANCA: readonly ItemSeguranca[] = [
  { id: 'S1', titulo: 'Dados faciais em arquivo, sem consentimento', estado: 'Corrigido', prioridade: 'Muito urgente', area: 'Biometria', ataques: 'D15, F01–F02, F20–F25', resumo: 'Amostras cifradas (AES-256-GCM) no banco, ML sem estado, consentimento obrigatório e versionado, retenção de 12 meses sem uso, exclusão ao encerrar a conta ou desligar o funcionário; faces.json apagado.' },
  { id: 'S2', titulo: 'Token interno do ML com valor padrão público', estado: 'Corrigido', prioridade: 'Urgente', area: 'Serviço de ML', ataques: 'E01a–E01c', resumo: 'Fora de desenvolvimento a API e o ML recusam o padrão público e exigem um segredo próprio de 32+ caracteres (ataque E01b). Em desenvolvimento o padrão continua aceito de propósito, e o ML escuta só em 127.0.0.1.' },
  { id: 'S3', titulo: 'Login facial: prova de vida e limites', estado: 'Parcial', prioridade: 'Urgente', area: 'Biometria', ataques: 'D16–D17', resumo: 'Implementado: prova de vida passiva (MiniFASNet) ligada por padrão e com falha fechada, passagem pelo bloqueio de conta e pelo limite por conta + IP, código do 2FA exigido. Falta apenas medir a detecção de foto impressa e de tela com a webcam real.' },
  { id: 'S4', titulo: 'ForwardedHeaders e limite por IP atrás do proxy', estado: 'Corrigido', prioridade: 'Urgente', area: 'Borda e rede', ataques: 'A12, A18', resumo: 'Só aceita X-Forwarded-For de TRUSTED_PROXIES; o limite é por IP, e IPv6 vale pelo prefixo /64.' },
  { id: 'S5', titulo: 'Dependências vulneráveis', estado: 'Corrigido', prioridade: 'Médio', area: 'Cadeia de suprimentos', ataques: 'D13', resumo: 'dotnet list --vulnerable limpo nos 7 projetos; npm audit --omit=dev com 0; pip-audit sem vulnerabilidades conhecidas.' },
  { id: 'S6', titulo: 'Cadastro aberto, sem confirmação de e-mail', estado: 'Parcial', prioridade: 'Médio', area: 'Sessão e senha', ataques: 'A11, A13, A16', resumo: 'Limite de 5 cadastros por hora por IP e mensagem neutra no cadastro. Sem confirmação de e-mail: a pendência A16 aparece em toda rodada.' },
  { id: 'S7', titulo: 'Exposição do banco e do ML em desenvolvimento', estado: 'Ignorado', prioridade: 'Urgente', area: 'Borda e rede', ataques: 'D11', resumo: 'Ignorado por decisão (Docker fora de escopo). Em produção o banco não deve ficar acessível de fora e a conexão da API deve usar um usuário de menor privilégio; o ML já escuta só em 127.0.0.1.' },
  { id: 'S8', titulo: 'Cabeçalhos, CSP e TLS', estado: 'Parcial', prioridade: 'Médio', area: 'Borda e rede', ataques: 'D01–D02', resumo: 'API completa (cabeçalhos em toda resposta). O SPA ainda não tem CSP e o nginx está em HTTP — ignorados junto com o Docker.' },
  { id: 'S9', titulo: 'Limites de corpo da requisição', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Borda e rede', ataques: 'C04, E01d', resumo: 'API recusa corpo acima de 2 MB (413); o ML limita imagem a 4 milhões de caracteres e mensagem a 2.000.' },
  { id: 'S10', titulo: 'Rate limit global e por conta', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Borda e rede', ataques: 'A12–A15, E05', resumo: 'Limite global por usuário/IP, políticas auth e registro, câmeras do ML por usuário e login por par conta + IP.' },
  { id: 'S11', titulo: 'Dados pessoais em logs', estado: 'Corrigido', prioridade: 'Médio', area: 'Dados e logs', ataques: 'F01–F02 (logs)', resumo: 'E-mail mascarado nos logs e nenhum comando inteiro registrado; teste de varredura impede regressão.' },
  { id: 'S12', titulo: '/docs do ML e AllowedHosts', estado: 'Corrigido', prioridade: 'Médio', area: 'Serviço de ML', ataques: 'E04a–E04b', resumo: '/docs e /openapi.json só em desenvolvimento; /health mínimo em produção; AllowedHosts "*" gera aviso no log.' },
  { id: 'S13', titulo: 'CPF e CNPJ conferidos só no front-end', estado: 'Corrigido', prioridade: 'Médio', area: 'Regras de negócio', ataques: 'C10', resumo: 'O servidor passou a conferir o dígito verificador; CPF inválido é recusado.' },
  { id: 'S14', titulo: 'Sem trilha de auditoria', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Dados e logs', ataques: 'B20–B24, F30–F31', resumo: 'Trilha por empresa com dados, rosto, login, falha, bloqueio, troca de senha, 2FA, reuso de token e logout, e tela "Auditoria" (só Empresa). Sem valores nem dados pessoais.' },
  { id: 'S15', titulo: 'CSRF em rotacionar e sair', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Sessão e senha', ataques: 'D04', resumo: 'O cookie só vale com o cabeçalho X-Locadora-Client; sem ele, 403.' },
  { id: 'S16', titulo: 'CI de segurança', estado: 'Ignorado', prioridade: 'Não urgente', area: 'Cadeia de suprimentos', ataques: '—', resumo: 'Ignorado por decisão (CI fora de escopo): a bateria Testes-Seguranca/ roda à mão.' },
  { id: 'S17', titulo: 'Validação da chave do JWT', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Sessão e senha', ataques: 'A02–A04', resumo: 'A chave precisa ter pelo menos 32 caracteres; tokens com payload alterado, alg=none ou outra chave são recusados.' },
  { id: 'S18', titulo: 'Segundo fator e recuperação de senha', estado: 'Corrigido', prioridade: 'Sem prioridade', area: 'Sessão e senha', ataques: 'F04–F17', resumo: 'TOTP com 10 códigos de recuperação (exigido também no login facial) e "esqueci minha senha" por e-mail, sem enumeração. Só envia e-mail de verdade com SMTP_HOST configurado.' },
  { id: 'S19', titulo: 'ClockSkew e SaveToken', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Sessão e senha', ataques: 'A02', resumo: 'Tolerância de relógio de 30 s e token não guardado no contexto de autenticação.' },
  { id: 'S20', titulo: 'Enumeração de usuários', estado: 'Corrigido', prioridade: 'Sem prioridade', area: 'Sessão e senha', ataques: 'A09–A11', resumo: 'Tempo de login igual para e-mail existente e inexistente, mesma mensagem para senha errada, bloqueio e e-mail inexistente, cadastro neutro.' },
  { id: 'S21', titulo: 'Iterações do hash de senha', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Sessão e senha', ataques: '—', resumo: 'PBKDF2 com 210.000 iterações.' },
  { id: 'S22', titulo: 'Senha gravada em log', estado: 'Corrigido', prioridade: 'Muito urgente', area: 'Dados e logs', ataques: 'F01–F02 (logs)', resumo: 'Os handlers não registram mais o comando inteiro; um teste de varredura garante que nenhum log contém a senha.' },
  { id: 'S23', titulo: 'Cadeia de suprimentos do ML', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Cadeia de suprimentos', ataques: 'D16b, D18', resumo: 'Peso do YOLO e modelos com SHA-256 e commit fixo; requirements.lock.txt com hashes instalado com --require-hashes e teste que impede o lock de ficar defasado.' },
  { id: 'S24', titulo: 'ML sem isolamento por empresa', estado: 'Corrigido', prioridade: 'Muito urgente', area: 'Serviço de ML', ataques: 'E03a–E03d', resumo: 'Câmeras, stream e placas só da empresa dona (CAMERA_EMPRESA_ID); /api/auth/sessao devolve empresa e papel ao ML.' },
  { id: 'S25', titulo: 'ML abria por padrão (fail-open)', estado: 'Corrigido', prioridade: 'Médio', area: 'Serviço de ML', ataques: 'D10–D12', resumo: 'ML_ENV ausente conta como produção, escuta só em 127.0.0.1 e o reload automático é só de desenvolvimento.' },
  { id: 'S26', titulo: 'Desligar funcionário não encerrava o acesso', estado: 'Corrigido', prioridade: 'Urgente', area: 'Sessão e senha', ataques: 'B30–B33', resumo: 'O token de acesso é invalidado na hora, a conta é bloqueada, o rosto é apagado e o login responde 4xx (nunca 500).' },
  { id: 'S27', titulo: 'Sem troca de senha autenticada', estado: 'Corrigido', prioridade: 'Urgente', area: 'Sessão e senha', ataques: 'B40–B42', resumo: 'POST /api/auth/alterar-senha e redefinição pela empresa derrubam as sessões; tela "Minha conta" e front alinhado à política do servidor.' },
  { id: 'S28', titulo: 'Bloqueio de conta usado como arma', estado: 'Corrigido', prioridade: 'Médio', area: 'Sessão e senha', ataques: 'A08b, A15, A15b', resumo: '5 erros travam só o par conta + IP; 10 erros vindos de vários IPs travam a conta. Risco residual: atacante com 2 ou mais IPs.' },
  { id: 'S29', titulo: 'Refresh token: reuso e rotação', estado: 'Corrigido', prioridade: 'Médio', area: 'Sessão e senha', ataques: 'A06–A07, A17', resumo: 'Reuso derruba a sessão inteira, a rotação é atômica (seis simultâneas, no máximo uma vale) e tokens encerrados há 30 dias são apagados.' },
  { id: 'S30', titulo: 'Pacotes e código morto', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Cadeia de suprimentos', ataques: 'D13–D14', resumo: 'Pacotes referenciados e nunca usados e código com IgnoreQueryFilters removidos.' },
  { id: 'S31', titulo: 'Foto do veículo com esquema perigoso', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Regras de negócio', ataques: 'C11–C12', resumo: 'Só https ou imagem pequena (≤ 300 KB); javascript:, file:, http: e data:text/html são recusados.' },
  { id: 'S32', titulo: 'Funcionário alterava taxas de serviço', estado: 'Corrigido', prioridade: 'Não urgente', area: 'Regras de negócio', ataques: 'B04a–B04c', resumo: 'Só a Empresa cria, edita e exclui taxas; o Funcionário continua lendo para montar o aluguel.' },
  { id: 'S33', titulo: 'Comparador de identidade facial fraco', estado: 'Corrigido', prioridade: 'Novo', area: 'Biometria', ataques: 'D18', resumo: 'A geometria de landmarks recusava a pessoa certa em 94 % dos pares do LFW; trocada pelo SFace: acurácia 98,3 %, FAR 0,067 %, FRR 3,1 %.' },
  { id: 'S34', titulo: 'Corridas e integridade de negócio', estado: 'Corrigido', prioridade: 'Novo', area: 'Regras de negócio', ataques: 'H01–H06', resumo: 'Reserva dupla, cupom de uso único e iniciar o aluguel várias vezes ao mesmo tempo; cliente de outra empresa, período de 50 anos e taxa inexistente. Serialização por empresa (vale para uma instância da API).' },
  { id: 'S35', titulo: 'Entrada hostil', estado: 'Corrigido', prioridade: 'Novo', area: 'Dados e logs', ataques: 'G04, G06, G09, G11, G14', resumo: 'Senha de 180 mil caracteres (agora teto de 128), replay do código TOTP e e-mail com quebra de linha forjando entrada de log.' }
];

export const ORDEM_PRIORIDADE: readonly PrioridadeOriginal[] = ['Muito urgente', 'Urgente', 'Médio', 'Não urgente', 'Sem prioridade', 'Novo'];
