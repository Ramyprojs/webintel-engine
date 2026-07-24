import os
import sys

# Ensure backend is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import get_sync_session, sync_engine
from app.models.job import Job, InputType, JobStatus
from app.worker.tasks import process_job

def run():
    print("Initializing test job...")
    
    # 1. Test Domain Job
    with get_sync_session() as db:
        job = Job(
            input_type=InputType.domain,
            input_value="books.toscrape.com",
            status=JobStatus.queued
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        job_id_domain = job.id
        
    print(f"Created Domain Job: {job_id_domain}")
    
    # Run the worker task synchronously
    print("Processing Domain Job...")
    process_job(str(job_id_domain))
    print("Domain Job processing finished.\n")
    
    # 2. Test Keyword Job
    with get_sync_session() as db:
        job2 = Job(
            input_type=InputType.keyword,
            input_value="AI startups in san francisco",
            status=JobStatus.queued
        )
        db.add(job2)
        db.commit()
        db.refresh(job2)
        job_id_keyword = job2.id
        
    print(f"Created Keyword Job: {job_id_keyword}")
    
    # Run the worker task synchronously
    print("Processing Keyword Job...")
    process_job(str(job_id_keyword))
    print("Keyword Job processing finished.\n")
    
if __name__ == "__main__":
    run()
