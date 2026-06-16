from flask import Flask, render_template, jsonify, request
import feedparser
import requests
from bs4 import BeautifulSoup
import re
import urllib.parse

app = Flask(__name__)

FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

def parse_entry_content(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    items = []
    current_type = "General"
    current_html = []
    current_text = ""
    
    # Iterate through children to split by <h3> tags
    for child in soup.contents:
        # Check if the child is a tag and is <h3>
        if getattr(child, 'name', None) == 'h3':
            if current_html:
                items.append({
                    'type': current_type,
                    'html': "".join(current_html),
                    'text': re.sub(r'\s+', ' ', current_text).strip()
                })
                current_html = []
                current_text = ""
            current_type = child.get_text().strip()
        elif child.name:
            # We preserve the HTML structure for displaying
            current_html.append(str(child))
            current_text += " " + child.get_text()
            
    if current_html:
        items.append({
            'type': current_type,
            'html': "".join(current_html),
            'text': re.sub(r'\s+', ' ', current_text).strip()
        })
        
    return items

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        # Fetch with requests to support timeouts
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse RSS Feed
        feed = feedparser.parse(response.content)
        
        releases = []
        for entry in feed.entries:
            date_str = entry.get('title', 'Unknown Date')
            link = entry.get('link', '')
            entry_id = entry.get('id', '')
            
            content_val = entry.get('content')
            html_content = ""
            if content_val:
                html_content = content_val[0].value
            else:
                html_content = entry.get('summary', '')
                
            items = parse_entry_content(html_content)
            
            releases.append({
                'date': date_str,
                'link': link,
                'id': entry_id,
                'items': items
            })
            
        return jsonify({
            'status': 'success',
            'title': feed.feed.get('title', 'BigQuery Release Notes'),
            'releases': releases
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/generate-tweet', methods=['POST'])
def generate_tweet():
    data = request.get_json() or {}
    text = data.get('text', '')
    style = data.get('style', 'hype')
    link = data.get('link', '')
    item_type = data.get('type', 'Feature')
    
    if not text:
        return jsonify({'status': 'error', 'message': 'No text provided'}), 400

    # Clean up text a bit (truncate if too long for preview)
    max_text_len = 160
    cleaned_text = text
    if len(cleaned_text) > max_text_len:
        # Try to break at word boundary
        truncated = cleaned_text[:max_text_len]
        last_space = truncated.rfind(' ')
        if last_space > 100:
            cleaned_text = truncated[:last_space] + '...'
        else:
            cleaned_text = truncated + '...'

    # Emojis based on update type
    emoji_map = {
        'feature': '🚀 New Feature',
        'change': '🔄 Change',
        'deprecated': '⚠️ Deprecated',
        'deprecation': '⚠️ Deprecated',
        'issue': '❌ Known Issue',
        'bug': '🛠️ Bug Fix',
        'resolved': '✅ Resolved',
        'general': '📢 Update'
    }
    
    type_lower = item_type.lower()
    prefix = emoji_map.get(type_lower, '📢 BigQuery Update')
    for key, val in emoji_map.items():
        if key in type_lower:
            prefix = val
            break

    # Tweet generator based on style
    if style == 'hype':
        tweet = f"{prefix} for #BigQuery! 🔥\n\n\"{cleaned_text}\"\n\nDetails here 👇\n🔗 {link}\n\n#GoogleCloud #DataEngineering"
    elif style == 'professional':
        tweet = f"Google Cloud has announced a BigQuery update ({item_type}):\n\n\"{cleaned_text}\"\n\nRead the release notes here:\n{link}\n\n#BigQuery #GoogleCloud #CloudComputing"
    elif style == 'punchy':
        tweet = f"{prefix}: {cleaned_text} {link} #BigQuery"
    else: # Default/custom
        tweet = f"{prefix}: {cleaned_text} {link}"

    return jsonify({
        'status': 'success',
        'tweet': tweet
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
