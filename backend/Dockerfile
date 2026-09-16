FROM python:3.12-slim

# Create user 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements and install
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application files
COPY --chown=user . $HOME/app

# Expose default Hugging Face Spaces port
EXPOSE 7860

# Start Uvicorn — tôn trọng $PORT của platform (Render) nếu có, mặc định 7860
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
