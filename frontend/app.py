# frontend/app.py
import streamlit as st
import pandas as pd
import requests
import json
import time
from io import BytesIO
from datetime import datetime

BACKEND_URL = "http://localhost:3000"

st.set_page_config(
    page_title="POC Automação Cypress",
    page_icon="🚀",
    layout="wide"
)

st.title("🚀 POC Automação de Testes com Cypress")
st.markdown("Envie sua planilha com os cenários de teste e execute a automação")

# ============================================
# SIDEBAR
# ============================================
with st.sidebar:
    st.header("📋 Instruções")
    st.markdown("""
    1. Baixe o modelo de planilha
    2. Preencha com seus cenários
    3. Faça o upload
    4. Execute os testes
    5. Baixe o relatório
    """)

    modelo = pd.DataFrame({
        "cenario":            ["Login com sucesso", "Login com email inválido"],
        "email":              ["admin@email.com",   "invalido@"],
        "senha":              ["123456",             "123456"],
        "resultado_esperado": ["sucesso",            "erro"],
        "mensagem_esperada":  ["",                   "E-mail inválido"]
    })

    # ✅ Gera XLSX em memória (sem arquivo temporário em disco)
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        modelo.to_excel(writer, index=False, sheet_name='Cenarios')
    buffer.seek(0)

    st.download_button(
        label="📥 Baixar modelo de planilha",
        data=buffer,
        file_name="modelo_cenarios.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    st.divider()

    # ✅ Mostra se o backend já está ocupado antes de tentar executar
    st.subheader("🔌 Status do Backend")
    if st.button("🔄 Verificar"):
        try:
            r = requests.get(f"{BACKEND_URL}/api/status", timeout=3)
            data = r.json()
            if data.get("running"):
                st.warning("⚙️ Execução em andamento")
            else:
                st.success("✅ Backend livre")
        except Exception:
            st.error("❌ Backend offline")

# ============================================
# UPLOAD
# ============================================
uploaded_file = st.file_uploader(
    "📊 Escolha sua planilha",
    type=['xlsx', 'xls', 'csv']
)

if uploaded_file is not None:
    if uploaded_file.name.endswith('.csv'):
        df = pd.read_csv(uploaded_file)
    else:
        df = pd.read_excel(uploaded_file)

    st.success(f"✅ Planilha carregada! {len(df)} cenários encontrados.")

    with st.expander("🔍 Visualizar planilha"):
        st.dataframe(df, use_container_width=True)

    if st.button("🚀 Executar Testes", type="primary", use_container_width=True):

        # ✅ Verifica se já há execução ativa antes de enviar
        try:
            status_r = requests.get(f"{BACKEND_URL}/api/status", timeout=3)
            if status_r.json().get("running"):
                st.warning("⚠️ Já existe uma execução em andamento. Aguarde terminar.")
                st.stop()
        except requests.exceptions.ConnectionError:
            st.error("❌ Backend offline. Execute: node backend/server.js")
            st.stop()

        progress = st.progress(0)
        status   = st.empty()

        status.text("📤 Enviando planilha...")
        progress.progress(20)

        try:
            response = requests.post(
                f"{BACKEND_URL}/api/upload-and-run",
                files={
                    'planilha': (
                        uploaded_file.name,
                        uploaded_file.getvalue(),
                        'application/octet-stream'
                    )
                },
                timeout=300  # 5 min — testes podem demorar
            )

            status.text("⚙️ Executando testes...")
            progress.progress(60)

            if response.status_code == 200:
                resultados = response.json()

                status.text("📊 Processando resultados...")
                progress.progress(90)

                st.markdown("---")
                st.header("📊 Resultados da Execução")

                col1, col2, col3, col4 = st.columns(4)
                with col1: st.metric("📊 Total",    resultados.get('total',  0))
                with col2: st.metric("✅ Passaram", resultados.get('passed', 0))
                with col3: st.metric("❌ Falharam", resultados.get('failed', 0))
                with col4:
                    total  = resultados.get('total',  0)
                    passed = resultados.get('passed', 0)
                    rate   = f"{int(passed / total * 100)}%" if total > 0 else "—"
                    st.metric("🎯 Taxa", rate)

                if 'details' in resultados and resultados['details']:
                    st.subheader("📋 Detalhes dos Cenários")
                    details_df = pd.DataFrame(resultados['details'])
                    st.dataframe(details_df, use_container_width=True)

                progress.progress(100)
                status.text("✅ Execução finalizada!")

                if resultados.get('failed', 0) == 0:
                    st.balloons()
                else:
                    st.warning(f"⚠️ {resultados.get('failed')} cenário(s) falharam.")

                # ============================================
                # DOWNLOADS
                # ============================================
                st.markdown("---")
                st.subheader("📄 Baixar Relatório")

                col_dl1, col_dl2 = st.columns(2)

                with col_dl1:
                    if st.button("📊 Gerar Relatório HTML"):
                        with st.spinner("🔄 Gerando..."):
                            try:
                                rr = requests.get(f"{BACKEND_URL}/api/generate-report", timeout=15)
                                if rr.status_code == 200:
                                    st.download_button(
                                        label="✅ Baixar HTML",
                                        data=rr.text.encode('utf-8'),
                                        file_name=f"relatorio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html",
                                        mime="text/html"
                                    )
                                else:
                                    st.error(f"Erro {rr.status_code}")
                            except Exception as e:
                                st.error(f"❌ {e}")

                with col_dl2:
                    # ✅ Usa o JSON já retornado pela API, sem depender de arquivo local
                    json_data = json.dumps(resultados, indent=2, ensure_ascii=False)
                    st.download_button(
                        label="📥 Baixar JSON",
                        data=json_data.encode('utf-8'),
                        file_name=f"relatorio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                        mime="application/json"
                    )

            elif response.status_code == 409:
                status.text("⚠️ Recurso ocupado")
                st.warning("Já existe uma execução em andamento. Tente novamente em instantes.")
            else:
                status.text("❌ Erro na execução")
                st.error(f"Erro {response.status_code}: {response.text}")

        except requests.exceptions.ConnectionError:
            status.text("❌ Sem conexão")
            st.error("Não foi possível conectar ao servidor. Verifique se o back-end está rodando.")
            st.info("Execute: node backend/server.js")
        except requests.exceptions.Timeout:
            status.text("⏱️ Timeout")
            st.error("A requisição excedeu o tempo limite (5 min). Os testes podem estar rodando — verifique o terminal.")
        except Exception as e:
            status.text("❌ Erro")
            st.error(f"Erro inesperado: {e}")