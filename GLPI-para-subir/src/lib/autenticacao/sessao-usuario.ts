export const COOKIE_SESSAO = 'painel_sessao';
export const DURACAO_SESSAO_SEGUNDOS = 8 * 60 * 60;

export type UsuarioSessao = {
  id: number;
  login: string;
  nome: string;
  perfil: string;
};

type ConteudoSessao = UsuarioSessao & { expiraEm: number };

const codificador = new TextEncoder();
let chaveEmCache: Promise<CryptoKey> | null = null;

function segredo(): string {
  const valor = process.env.SESSAO_SEGREDO ?? '';
  if (valor.length < 32) {
    throw new Error('SESSAO_SEGREDO precisa ter pelo menos 32 caracteres. Veja .env.example.');
  }
  return valor;
}

function chave(): Promise<CryptoKey> {
  chaveEmCache ??= crypto.subtle.importKey(
    'raw',
    codificador.encode(segredo()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  return chaveEmCache;
}

function paraBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(texto: string): Uint8Array<ArrayBuffer> {
  const binario = atob(texto.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let indice = 0; indice < binario.length; indice++) bytes[indice] = binario.charCodeAt(indice);
  return bytes;
}

export async function assinarSessao(usuario: UsuarioSessao): Promise<string> {
  const conteudo: ConteudoSessao = {
    ...usuario,
    expiraEm: Math.floor(Date.now() / 1000) + DURACAO_SESSAO_SEGUNDOS,
  };
  const corpo = paraBase64Url(codificador.encode(JSON.stringify(conteudo)));
  const assinatura = await crypto.subtle.sign('HMAC', await chave(), codificador.encode(corpo));
  return `${corpo}.${paraBase64Url(new Uint8Array(assinatura))}`;
}

export async function verificarSessao(token: string | undefined): Promise<UsuarioSessao | null> {
  if (!token) return null;
  const [corpo, assinatura] = token.split('.');
  if (!corpo || !assinatura) return null;

  try {
    const valida = await crypto.subtle.verify(
      'HMAC',
      await chave(),
      deBase64Url(assinatura),
      codificador.encode(corpo),
    );
    if (!valida) return null;

    const conteudo = JSON.parse(new TextDecoder().decode(deBase64Url(corpo))) as ConteudoSessao;
    if (conteudo.expiraEm <= Math.floor(Date.now() / 1000)) return null;

    return { id: conteudo.id, login: conteudo.login, nome: conteudo.nome, perfil: conteudo.perfil };
  } catch {
    return null;
  }
}
