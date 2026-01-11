"""
Hourly Scheduler for Toronto News Scraper
Runs every hour and updates the latest news data
"""

import schedule
import time
from datetime import datetime
import logging
import sys
import os

# Import the scraper
try:
    from toronto_news_scraper import TorontoNewsScraper
except ImportError:
    # If running as webScraper.py, adjust import
    import importlib.util
    spec = importlib.util.spec_from_file_location("scraper", "webScraper.py")
    scraper_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scraper_module)
    TorontoNewsScraper = scraper_module.TorontoNewsScraper

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def run_scraper_job():
    """Job that runs every hour"""
    try:
        logger.info("=" * 50)
        logger.info(f"Starting hourly scrape at {datetime.now()}")
        logger.info("=" * 50)
        
        scraper = TorontoNewsScraper()
        articles = scraper.scrape_all_sources()
        
        # Always save as "latest" for widget to read
        scraper.save_to_csv(articles, "toronto_news_latest.csv")
        scraper.save_to_json(articles, "toronto_news_latest.json")
        
        # Also save timestamped backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
        scraper.save_to_csv(articles, f"archive/toronto_news_{timestamp}.csv")
        
        logger.info(f"Scrape completed at {datetime.now()}")
        logger.info("=" * 50 + "\n")
        
    except Exception as e:
        logger.error(f"Error in scheduled job: {e}", exc_info=True)


def main():
    """Main scheduler"""
    # Create archive directory
    os.makedirs('archive', exist_ok=True)
    
    logger.info("=" * 60)
    logger.info("TORONTO NEWS SCRAPER - HOURLY SCHEDULER")
    logger.info("=" * 60)
    logger.info("Widget will read from: toronto_news_latest.csv/json")
    logger.info("Archives saved to: archive/")
    logger.info("Scraper runs: Every hour on the hour")
    logger.info("=" * 60 + "\n")
    
    # Run immediately on startup
    logger.info("Running initial scrape...")
    run_scraper_job()
    
    # Schedule to run every hour
    schedule.every().minute.at(":00").do(run_scraper_job)
    
    logger.info("Scheduler is running. Press Ctrl+C to stop.\n")
    
    # Keep running
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)
    except KeyboardInterrupt:
        logger.info("\nScheduler stopped by user")


if __name__ == "__main__":
    main()