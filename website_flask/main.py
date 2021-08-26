import os

import flask
from flask import render_template, request
import requests
import ast

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app = flask.Flask(__name__, template_folder=ASSETS_DIR, static_folder=ASSETS_DIR)
app.config["DEBUG"] = True
api_url = os.getenv('API_URL')


@app.route("/", methods=['GET'])
def mapview():
    device_id = request.args.get('device_id', '')
    data = dict()
    url = api_url + '/get_localization' + (f'?device_id={device_id}' if device_id else '')
    app.logger.info(f'Trying to hit (GET) the URL: {url}')

    try:
        localization_response = requests.get(url)
        app.logger.info(f'API response with: {localization_response.text}')
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
                    },
                    'timestamp': localization_json['timestamp'],
                    'device_id': device_id
                }
            ]

            if device_id:
                data['middle'] = {
                    'longitude': float(localization_json['lon']) if 'lon' in localization_json else 0.0,
                    'latitude': float(localization_json['lat']) if 'lat' in localization_json else 0.0,
                }
        except BaseException as be:
            data['error'] = str(be)

    app.logger.info(f'Data: {data}')
    return render_template('map.html', data=data)


app.run(host='0.0.0.0')
