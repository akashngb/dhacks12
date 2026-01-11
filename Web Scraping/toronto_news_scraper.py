"""
Toronto News Scraper - GUARANTEED IMAGES VERSION
- Every article MUST have an image
- Scrapes images aggressively from article pages
- Generates placeholder images if none found
- Embeds PNG paths in JSON
"""

import requests
import json
import csv
from datetime import datetime
import time
from typing import List, Dict, Optional
import logging
from bs4 import BeautifulSoup
import re
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os
import hashlib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TorontoNewsScraper:
    """Scraper with GUARANTEED images for every article"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://www.google.com/'
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Create images directory
        os.makedirs('images', exist_ok=True)
        
        # Category colors for generated images
        self.category_colors = {
            'crime': '#DC2626',      # Red
            'fire': '#EA580C',       # Orange
            'accident': '#F59E0B',   # Amber
            'weather': '#3B82F6',    # Blue
            'news': '#6366F1'        # Indigo
        }
        
        # Toronto neighbourhoods
        self.neighbourhoods = [
            'Downtown', 'Etobicoke', 'North York', 'Scarborough', 'East York',
            'Yorkville', 'The Beaches', 'Liberty Village', 'King West', 'Queen West',
            'Distillery District', 'Financial District', 'Entertainment District',
            'Harbourfront', 'CityPlace', 'Junction', 'Leslieville', 'Roncesvalles',
            'High Park', 'Danforth', 'Little Italy', 'Kensington Market', 'Chinatown',
            'Annex', 'Forest Hill', 'Rosedale', 'Cabbagetown', 'Riverdale',
            'Parkdale', 'Bloor West Village', 'Lawrence Park', 'Don Mills',
            'Thorncliffe Park', 'York Mills', 'Willowdale', 'Agincourt', 'Malvern',
            'Mimico', 'Long Branch', 'Islington', 'Kingsway', 'Humber Bay',
            'Jane and Finch', 'Downsview', 'Eglinton West', 'Leaside', 'Brampton',
            'Mississauga', 'Vaughan', 'Markham', 'Richmond Hill', 'Oakville',
            'Burlington', 'Pickering', 'Ajax', 'Whitby', 'Oshawa', 'Durham',
            'Peel', 'Halton', 'York Region', 'GTA', 'Toronto', 'Simcoe'
        ]
        
        # Event keywords
        self.event_keywords = {
            'crime': [
                'shooting', 'shot', 'stabbing', 'stabbed', 'robbery', 'assault',
                'murder', 'killed', 'homicide', 'arrest', 'arrested', 'charged', 'police',
                'theft', 'stolen', 'break-in', 'gun', 'weapon', 'violence', 'suspect',
                'investigation', 'wanted', 'search', 'missing', 'found dead', 'body found'
            ],
            'fire': [
                'fire', 'blaze', 'arson', 'flames', 'smoke', 'burning', 'burnt',
                'firefighters', 'alarm', 'evacuate', 'evacuation', 'explosion'
            ],
            'accident': [
                'collision', 'crash', 'accident', 'pedestrian struck', 'hit-and-run',
                'vehicle', 'struck', 'injured', 'traffic', 'dies after being struck',
                'hit by', 'run over', 'highway closed'
            ],
            'weather': [
                'storm', 'weather', 'snow', 'ice', 'tornado', 'flood', 'flooding', 'freezing',
                'warning', 'rain', 'wind', 'cold', 'heat', 'advisory', 'blizzard', 'temperature'
            ]
        }
        
        self.image_cache = {}
    
    def generate_placeholder_image(self, headline: str, category: str, source: str) -> str:
        """Generate a placeholder PNG image with headline text"""
        try:
            # Create image
            width, height = 1200, 630
            img = Image.new('RGB', (width, height), color=self.category_colors.get(category, '#6366F1'))
            draw = ImageDraw.Draw(img)
            
            # Add gradient effect
            base_color = self.category_colors.get(category, '#6366F1')
            r, g, b = tuple(int(base_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            
            for i in range(height):
                fade = 1 - (i / height * 0.4)
                new_r = int(r * fade)
                new_g = int(g * fade)
                new_b = int(b * fade)
                draw.rectangle([(0, i), (width, i+1)], fill=(new_r, new_g, new_b))
            
            # Try to use a nice font, fallback to default
            try:
                # Try common font paths
                font_paths = [
                    "/System/Library/Fonts/Helvetica.ttc",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                    "C:\\Windows\\Fonts\\Arial.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
                ]
                
                title_font = None
                for font_path in font_paths:
                    try:
                        title_font = ImageFont.truetype(font_path, 60)
                        source_font = ImageFont.truetype(font_path, 40)
                        category_font = ImageFont.truetype(font_path, 35)
                        break
                    except:
                        continue
                
                if not title_font:
                    raise Exception("No fonts found")
                    
            except:
                title_font = ImageFont.load_default()
                source_font = ImageFont.load_default()
                category_font = ImageFont.load_default()
            
            # Wrap headline text
            words = headline.split()
            lines = []
            current_line = []
            
            for word in words:
                current_line.append(word)
                test_line = ' '.join(current_line)
                try:
                    bbox = draw.textbbox((0, 0), test_line, font=title_font)
                    if bbox[2] - bbox[0] > width - 100:
                        current_line.pop()
                        if current_line:
                            lines.append(' '.join(current_line))
                        current_line = [word]
                except:
                    # Fallback for default font
                    if len(test_line) > 40:
                        current_line.pop()
                        if current_line:
                            lines.append(' '.join(current_line))
                        current_line = [word]
            
            if current_line:
                lines.append(' '.join(current_line))
            
            # Limit to 3 lines
            lines = lines[:3]
            
            # Draw headline
            y_offset = (height - len(lines) * 80) // 2
            for line in lines:
                try:
                    bbox = draw.textbbox((0, 0), line, font=title_font)
                    text_width = bbox[2] - bbox[0]
                except:
                    text_width = len(line) * 10  # Rough estimate
                    
                x = (width - text_width) // 2
                
                # Shadow
                draw.text((x + 2, y_offset + 2), line, font=title_font, fill='#00000088')
                # Text
                draw.text((x, y_offset), line, font=title_font, fill='white')
                y_offset += 80
            
            # Draw source at bottom
            source_text = f"{source}"
            try:
                bbox = draw.textbbox((0, 0), source_text, font=source_font)
                source_width = bbox[2] - bbox[0]
            except:
                source_width = len(source_text) * 8
                
            draw.text(((width - source_width) // 2, height - 100), source_text, font=source_font, fill='white')
            
            # Draw category badge
            category_text = category.upper()
            try:
                bbox = draw.textbbox((0, 0), category_text, font=category_font)
                badge_width = bbox[2] - bbox[0] + 40
                badge_height = bbox[3] - bbox[1] + 20
            except:
                badge_width = len(category_text) * 15 + 40
                badge_height = 50
                
            badge_x = (width - badge_width) // 2
            badge_y = 40
            
            draw.rectangle([badge_x, badge_y, badge_x + badge_width, badge_y + badge_height], 
                          fill='#00000066', outline='white', width=2)
            draw.text((badge_x + 20, badge_y + 10), category_text, font=category_font, fill='white')
            
            # Save
            filename = hashlib.md5(headline.encode()).hexdigest()[:12]
            filepath = os.path.join('images', f'generated_{filename}.png')
            img.save(filepath, 'PNG', optimize=True)
            
            logger.info(f"  ✓ Generated placeholder image: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"  ✗ Could not generate placeholder: {e}")
            # Create a simple colored rectangle as absolute fallback
            try:
                img = Image.new('RGB', (1200, 630), color='#6366F1')
                filename = hashlib.md5(headline.encode()).hexdigest()[:12]
                filepath = os.path.join('images', f'simple_{filename}.png')
                img.save(filepath, 'PNG')
                return filepath
            except:
                return ''
    
    def scrape_image_from_article_page(self, url: str) -> str:
        """Visit article page and scrape the main image"""
        try:
            logger.info(f"  → Fetching image from article page...")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Strategy 1: Look for Open Graph image
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                img_url = og_image['content']
                if img_url.startswith('//'):
                    img_url = f"https:{img_url}"
                elif not img_url.startswith('http'):
                    from urllib.parse import urljoin
                    img_url = urljoin(url, img_url)
                logger.info(f"  ✓ Found OG image")
                return img_url
            
            # Strategy 2: Look for Twitter card image
            twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
            if twitter_image and twitter_image.get('content'):
                img_url = twitter_image['content']
                if img_url.startswith('//'):
                    img_url = f"https:{img_url}"
                elif not img_url.startswith('http'):
                    from urllib.parse import urljoin
                    img_url = urljoin(url, img_url)
                logger.info(f"  ✓ Found Twitter image")
                return img_url
            
            # Strategy 3: Find largest image in article
            images = soup.find_all('img', src=True)
            for img in images:
                src = img.get('src', '')
                # Filter out small icons, logos, etc.
                if any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'pixel', '1x1']):
                    continue
                
                width = img.get('width', '0')
                height = img.get('height', '0')
                
                try:
                    if width and height and str(width).isdigit() and str(height).isdigit():
                        if int(width) > 400 and int(height) > 200:
                            if src.startswith('//'):
                                src = f"https:{src}"
                            elif not src.startswith('http'):
                                from urllib.parse import urljoin
                                src = urljoin(url, src)
                            logger.info(f"  ✓ Found large image")
                            return src
                except:
                    pass
            
            # Strategy 4: Just get the first reasonable image
            for img in images:
                src = img.get('src', '') or img.get('data-src', '')
                if src and len(src) > 20:
                    if src.startswith('//'):
                        src = f"https:{src}"
                    elif not src.startswith('http'):
                        from urllib.parse import urljoin
                        src = urljoin(url, src)
                    if 'data:image' not in src:
                        logger.info(f"  ✓ Found image")
                        return src
            
            logger.warning(f"  ✗ No suitable image found on article page")
            return ''
            
        except Exception as e:
            logger.warning(f"  ✗ Could not scrape article page: {e}")
            return ''
    
    def download_and_convert_image(self, image_url: str, article_url: str, headline: str, category: str, source: str) -> str:
        """Download image and convert to PNG, with fallback to article page scraping and generation"""
        
        # Check cache first
        cache_key = hashlib.md5((image_url if image_url else article_url).encode()).hexdigest()[:12]
        if cache_key in self.image_cache:
            return self.image_cache[cache_key]
        
        # Try downloading the provided image URL
        if image_url and image_url.startswith('http'):
            try:
                logger.info(f"  → Downloading image from URL...")
                response = self.session.get(image_url, timeout=10)
                response.raise_for_status()
                
                img = Image.open(BytesIO(response.content))
                
                # Convert to RGB
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if too large
                max_size = (1200, 630)
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Save
                filename = f"news_{cache_key}.png"
                filepath = os.path.join('images', filename)
                img.save(filepath, 'PNG', optimize=True)
                
                logger.info(f"  ✓ Saved image: {filepath}")
                self.image_cache[cache_key] = filepath
                return filepath
                
            except Exception as e:
                logger.warning(f"  ✗ Failed to download image: {e}")
        
        # Try scraping the article page for an image
        if article_url:
            scraped_img_url = self.scrape_image_from_article_page(article_url)
            if scraped_img_url:
                try:
                    response = self.session.get(scraped_img_url, timeout=10)
                    response.raise_for_status()
                    
                    img = Image.open(BytesIO(response.content))
                    
                    # Convert to RGB
                    if img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        if img.mode == 'RGBA':
                            background.paste(img, mask=img.split()[-1])
                        else:
                            background.paste(img)
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Resize if needed
                    max_size = (1200, 630)
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    # Save
                    filename = f"scraped_{cache_key}.png"
                    filepath = os.path.join('images', filename)
                    img.save(filepath, 'PNG', optimize=True)
                    
                    logger.info(f"  ✓ Scraped and saved image: {filepath}")
                    self.image_cache[cache_key] = filepath
                    return filepath
                    
                except Exception as e:
                    logger.warning(f"  ✗ Failed to download scraped image: {e}")
        
        # Last resort: Generate placeholder image
        logger.info(f"  → Generating placeholder image...")
        filepath = self.generate_placeholder_image(headline, category, source)
        self.image_cache[cache_key] = filepath
        return filepath
    
    def extract_cp24_articles(self) -> List[Dict]:
        """Scrape CP24.com"""
        articles = []
        try:
            logger.info("Scraping CP24...")
            response = self.session.get("https://www.cp24.com", timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            all_links = soup.find_all('a', href=re.compile(r'/(local|news|weather)/.+/\d{4}/\d{2}/\d{2}/'))
            
            seen_urls = set()
            for link in all_links[:50]:
                url = link.get('href', '')
                if url in seen_urls or not url:
                    continue
                seen_urls.add(url)
                
                if url.startswith('/'):
                    url = f"https://www.cp24.com{url}"
                
                title = ''
                heading = link.find(['h1', 'h2', 'h3', 'h4'])
                if heading:
                    title = heading.get_text(strip=True)
                
                if not title or len(title) < 15:
                    continue
                
                if any(x in title.lower() for x in ['cp24', 'breaking news', 'latest news']) and len(title) < 30:
                    continue
                
                # Find image URL
                image_url = ''
                parent = link.find_parent(['article', 'div', 'li'])
                if parent:
                    img = parent.find('img', src=True)
                    if img:
                        image_url = img.get('src', '')
                        if image_url.startswith('/'):
                            image_url = f"https://www.cp24.com{image_url}"
                        elif image_url.startswith('//'):
                            image_url = f"https:{image_url}"
                
                description = ''
                if parent:
                    desc_elem = parent.find('p')
                    if desc_elem:
                        desc_text = desc_elem.get_text(strip=True)
                        if desc_text and desc_text != title:
                            description = desc_text
                
                articles.append({
                    'title': title,
                    'url': url,
                    'image_url': image_url,
                    'description': description,
                    'source': 'CP24'
                })
            
            logger.info(f"  ✓ Found {len(articles)} articles")
        except Exception as e:
            logger.error(f"  ✗ Error: {e}")
        
        return articles[:15]
    
    def extract_cbc_articles(self) -> List[Dict]:
        """Scrape CBC Toronto"""
        articles = []
        try:
            logger.info("Scraping CBC Toronto...")
            response = self.session.get("https://www.cbc.ca/news/canada/toronto", timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            article_links = soup.find_all('a', href=re.compile(r'/news/canada/toronto/'))
            
            seen_urls = set()
            for link in article_links[:50]:
                url = link.get('href', '')
                if url in seen_urls or not url or url == '/news/canada/toronto':
                    continue
                seen_urls.add(url)
                
                if not url.startswith('http'):
                    url = f"https://www.cbc.ca{url}"
                
                title = ''
                heading = link.find(['h1', 'h2', 'h3', 'h4', 'span'])
                if heading:
                    title = heading.get_text(strip=True)
                
                if not title or len(title) < 15:
                    continue
                
                if any(x in title.lower() for x in ['cbc toronto', 'cbc news']) and len(title) < 30:
                    continue
                
                image_url = ''
                parent = link.find_parent(['article', 'div', 'li'])
                if parent:
                    img = parent.find('img')
                    if img:
                        image_url = img.get('src') or img.get('data-src', '')
                        if image_url and not image_url.startswith('http'):
                            if image_url.startswith('//'):
                                image_url = f"https:{image_url}"
                
                description = ''
                if parent:
                    desc = parent.find('p')
                    if desc:
                        desc_text = desc.get_text(strip=True)
                        if desc_text and desc_text != title:
                            description = desc_text
                
                articles.append({
                    'title': title,
                    'url': url,
                    'image_url': image_url,
                    'description': description,
                    'source': 'CBC Toronto'
                })
            
            logger.info(f"  ✓ Found {len(articles)} articles")
        except Exception as e:
            logger.error(f"  ✗ Error: {e}")
        
        return articles[:15]
    
    def extract_globalnews_articles(self) -> List[Dict]:
        """Scrape Global News Toronto"""
        articles = []
        try:
            logger.info("Scraping Global News Toronto...")
            response = self.session.get("https://globalnews.ca/toronto", timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            article_elements = soup.find_all(['article', 'li', 'div'], limit=100)
            
            seen_urls = set()
            for elem in article_elements:
                link = elem.find('a', href=True)
                if not link:
                    continue
                
                url = link['href']
                if url in seen_urls or not url:
                    continue
                
                if '/toronto/' not in url and 'globalnews.ca/news/' not in url:
                    continue
                
                seen_urls.add(url)
                
                if not url.startswith('http'):
                    url = f"https://globalnews.ca{url}"
                
                title = ''
                heading = elem.find(['h1', 'h2', 'h3', 'h4', 'h5'])
                if heading:
                    title = heading.get_text(strip=True)
                
                if not title or len(title) < 15:
                    continue
                
                if any(x in title.lower() for x in ['global news toronto', 'global news']) and len(title) < 30:
                    continue
                
                image_url = ''
                img = elem.find('img')
                if img:
                    image_url = img.get('data-src') or img.get('src', '')
                    if image_url and not image_url.startswith('http'):
                        if image_url.startswith('//'):
                            image_url = f"https:{image_url}"
                        elif image_url.startswith('/'):
                            image_url = f"https://globalnews.ca{image_url}"
                
                description = ''
                desc = elem.find('p')
                if desc:
                    desc_text = desc.get_text(strip=True)
                    if desc_text and desc_text != title:
                        description = desc_text
                
                articles.append({
                    'title': title,
                    'url': url,
                    'image_url': image_url,
                    'description': description,
                    'source': 'Global News'
                })
            
            logger.info(f"  ✓ Found {len(articles)} articles")
        except Exception as e:
            logger.error(f"  ✗ Error: {e}")
        
        return articles[:15]
    
    def extract_citynews_articles(self) -> List[Dict]:
        """Scrape CityNews Toronto"""
        articles = []
        try:
            logger.info("Scraping CityNews Toronto...")
            response = self.session.get("https://toronto.citynews.ca", timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            article_links = soup.find_all('a', href=True, limit=100)
            
            seen_urls = set()
            for link in article_links:
                url = link['href']
                if url in seen_urls:
                    continue
                
                if not any(x in url for x in ['/news/', '/toronto/', '202']):
                    continue
                
                seen_urls.add(url)
                
                if not url.startswith('http'):
                    url = f"https://toronto.citynews.ca{url}"
                
                title = ''
                heading = link.find(['h1', 'h2', 'h3', 'h4'])
                if heading:
                    title = heading.get_text(strip=True)
                elif link.get_text(strip=True) and len(link.get_text(strip=True)) > 20:
                    title = link.get_text(strip=True)
                
                if not title or len(title) < 15:
                    continue
                
                if any(x in title.lower() for x in ['citynews toronto', 'citynews']) and len(title) < 30:
                    continue
                
                parent = link.find_parent(['article', 'div'])
                image_url = ''
                if parent:
                    img = parent.find('img')
                    if img:
                        image_url = img.get('src') or img.get('data-src', '')
                        if image_url and not image_url.startswith('http'):
                            if image_url.startswith('//'):
                                image_url = f"https:{image_url}"
                
                description = ''
                if parent:
                    desc = parent.find('p')
                    if desc:
                        desc_text = desc.get_text(strip=True)
                        if desc_text and desc_text != title:
                            description = desc_text
                
                articles.append({
                    'title': title,
                    'url': url,
                    'image_url': image_url,
                    'description': description,
                    'source': 'CityNews'
                })
            
            logger.info(f"  ✓ Found {len(articles)} articles")
        except Exception as e:
            logger.error(f"  ✗ Error: {e}")
        
        return articles[:15]
    
    def extract_neighbourhood(self, title: str, description: str) -> str:
        """Extract neighbourhood"""
        text = (title + " " + description).lower()
        for neighbourhood in self.neighbourhoods:
            if neighbourhood.lower() in text:
                return neighbourhood
        return 'Toronto'
    
    def categorize_event(self, title: str, description: str) -> str:
        """Categorize event"""
        text = (title + " " + description).lower()
        
        scores = {}
        for event_type, keywords in self.event_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[event_type] = score
        
        if scores:
            return max(scores, key=scores.get)
        
        return 'news'
    
    def process_article(self, article: Dict) -> Optional[Dict]:
        """Process article with GUARANTEED image"""
        title = article.get('title', '').strip()
        description = article.get('description', '').strip()
        
        if not title or len(title) < 15:
            return None
        
        category = self.categorize_event(title, description)
        
        logger.info(f"\nProcessing: {title[:60]}...")
        
        # GUARANTEED image - tries multiple strategies
        image_path = self.download_and_convert_image(
            article.get('image_url', ''),
            article.get('url', ''),
            title,
            category,
            article.get('source', '')
        )
        
        return {
            'headline': title,
            'description': description if description else title,
            'source': article.get('source', ''),
            'url': article.get('url', ''),
            'image': image_path,
            'neighbourhood': self.extract_neighbourhood(title, description),
            'category': category
        }
    
    def remove_duplicates(self, articles: List[Dict]) -> List[Dict]:
        """Remove duplicate articles"""
        seen = set()
        unique = []
        
        for article in articles:
            title_norm = re.sub(r'\W+', '', article['headline'].lower())
            title_key = title_norm[:50] if len(title_norm) > 50 else title_norm
            
            if title_key and title_key not in seen:
                seen.add(title_key)
                unique.append(article)
        
        return unique
    
    def scrape_all_sources(self) -> List[Dict]:
        """Scrape all sources"""
        all_articles = []
        
        logger.info("\n" + "="*60)
        logger.info("🚀 STARTING NEWS SCRAPE WITH GUARANTEED IMAGES")
        logger.info("="*60 + "\n")
        
        sources = [
            self.extract_cp24_articles,
            self.extract_cbc_articles,
            self.extract_globalnews_articles,
            self.extract_citynews_articles
        ]
        
        for scraper_func in sources:
            try:
                articles_raw = scraper_func()
                
                for article in articles_raw:
                    processed = self.process_article(article)
                    if processed:
                        all_articles.append(processed)
                
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"Source failed: {e}")
        
        unique = self.remove_duplicates(all_articles)
        
        # Print stats
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ SCRAPING COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"📰 Total articles: {len(unique)}")
        
        source_counts = {}
        for article in unique:
            source = article['source']
            source_counts[source] = source_counts.get(source, 0) + 1
        
        logger.info("\n📊 By source:")
        for source, count in sorted(source_counts.items()):
            logger.info(f"   • {source}: {count}")
        
        with_images = sum(1 for a in unique if a['image'])
        logger.info(f"\n🖼️  Articles with images: {with_images}/{len(unique)}")
        
        # Category breakdown
        category_counts = {}
        for article in unique:
            cat = article['category']
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        logger.info("\n📂 By category:")
        for cat, count in sorted(category_counts.items()):
            logger.info(f"   • {cat}: {count}")
        
        logger.info(f"{'='*60}\n")
        
        return unique
    
    def save_to_csv(self, articles: List[Dict], filename: str = "toronto_news_latest.csv"):
        """Save to CSV with clean fields"""
        if not articles:
            logger.warning("No articles to save")
            return
        
        fieldnames = ['headline', 'description', 'source', 'url', 'image', 'neighbourhood', 'category']
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(articles)
        
        logger.info(f"✓ Saved to {filename}")
    
    def save_to_json(self, articles: List[Dict], filename: str = "toronto_news_latest.json"):
        """Save to JSON with clean structure"""
        if not articles:
            logger.warning("No articles to save")
            return
        
        output = {
            'generated_at': datetime.now().isoformat(),
            'total_articles': len(articles),
            'articles': articles
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✓ Saved to {filename}")


def main():
    """Run the scraper"""
    scraper = TorontoNewsScraper()
    
    logger.info("\n" + "="*70)
    logger.info("📰 TORONTO NEWS SCRAPER - GUARANTEED IMAGES")
    logger.info("="*70 + "\n")
    
    articles = scraper.scrape_all_sources()
    
    if articles:
        scraper.save_to_csv(articles)
        scraper.save_to_json(articles)
        
        logger.info("\n✅ Done! Files ready for your news widget.")
        logger.info("📁 toronto_news_latest.csv")
        logger.info("📁 toronto_news_latest.json")
        logger.info(f"📁 images/ ({len(os.listdir('images'))} PNG files)\n")
        
        # Show sample
        logger.info("📋 Sample article:")
        sample = articles[0]
        logger.info(f"   Headline: {sample['headline'][:60]}...")
        logger.info(f"   Source: {sample['source']}")
        logger.info(f"   Image: {sample['image']}")
        logger.info(f"   Category: {sample['category']}")
        logger.info(f"   Neighbourhood: {sample['neighbourhood']}\n")
    else:
        logger.warning("No articles found!")


if __name__ == "__main__":
    main()