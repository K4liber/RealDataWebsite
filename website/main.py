import os

import flask
from flask import render_template
import requests
import ast

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app = flask.Flask(__name__, template_folder=ASSETS_DIR, static_folder=ASSETS_DIR)
app.config["DEBUG"] = True
api_url = os.getenv('API_URL')


@app.route("/")
def mapview():
    data = dict()
    url = api_url + '/get_localization'
    app.logger.info(f'Trying to hit (GET) the URL: {url}')

    try:
        localization_response = requests.get(url)
        localization_json = ast.literal_eval(localization_response.text)
        app.logger.info(localization_json)
    except BaseException as be:
        localization_json = None
        app.logger.warning(f'API exception: {be}')
        data['error'] = str(be)

    if localization_json:
        try:
            data['devices'] = [
                {
                    'localization': {
                        'longitude': float(localization_json['lon']) if 'lon' in localization_json else 0.0,
                        'latitude': localization_json['lat'] if 'lat' in localization_json else 0.0,
                    }
                }
            ]
        except BaseException as be:
            data['error'] = str(be)

    app.logger.info(f'Data: {data}')
    return render_template('map.html', data=data)


app.run(host='0.0.0.0')
