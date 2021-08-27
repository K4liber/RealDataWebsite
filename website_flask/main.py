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
    data = {
        'errors': [],
    }

    try:
        device_ids_request_url = api_url + f'/get_device_ids'
        device_ids_response = requests.get(device_ids_request_url)
        status_code = device_ids_response.status_code

        if status_code == 200:
            data['device_ids'] = ast.literal_eval(device_ids_response.text)
        else:
            data['errors'].append(f'API GET URL = {device_ids_request_url} status code = {status_code}')
    except BaseException as be:
        app.logger.warning(f'API exception: {be}')
        data['errors'].append(str(be))

    device_id = request.args.get('device_id', '')

    if device_id:
        url = api_url + f'/get_localization?device_id={device_id}'
        app.logger.info(f'Trying to hit (GET) the URL: {url}')

        try:
            localization_response = requests.get(url)
            app.logger.info(f'API response with: {localization_response.text}')
            localization_json = ast.literal_eval(localization_response.text)
            app.logger.info(localization_json)
        except BaseException as be:
            localization_json = None
            app.logger.warning(f'API exception: {be}')
            data['errors'].append(str(be))

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
                data['errors'].append(str(be))

    app.logger.info(f'Data: {data}')
    return render_template('map.html', data=data)


app.run(host='0.0.0.0')
