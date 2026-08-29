# -------- development --------
FROM python:3.12-slim AS development
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["flask", "--app", "app.main", "run", "--host=0.0.0.0", "--port=5001", "--debug"]

# -------- production --------
FROM python:3.12-slim AS production
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "app.main:app"]
