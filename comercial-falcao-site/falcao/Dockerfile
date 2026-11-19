FROM python:3.13-slim
WORKDIR /app
COPY . .
ENV FALCAO_TRUST_PROXY=1 FALCAO_DATA=/app/data PORT=8000
VOLUME /app/data
EXPOSE 8000
CMD ["python3", "server.py"]
