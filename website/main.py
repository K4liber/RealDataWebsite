import os
from dataclasses import dataclass
from typing import Optional, List

import flask
from flask import render_template
import requests


ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app = flask.Flask(__name__, template_folder=ASSETS_DIR, static_folder=ASSETS_DIR)
app.config["DEBUG"] = True
api_url = os.getenv('API_URL')


@dataclass
class Location:
    longitude: float
    latitude: float


@dataclass
class DeviceData:
    location: Optional[Location] = None


@dataclass
class Data:
    devices: Optional[List[DeviceData]] = None


@app.route("/")
def mapview():
    try:
        response = requests.get(api_url)
        app.logger.info(response.text)
    except BaseException as be:
        app.logger.warning(f'API exception: {be}')

    return render_template('map.html', data=Data())


app.run(host='0.0.0.0')
