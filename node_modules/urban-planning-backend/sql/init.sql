-- Urban Planning Platform Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS urban_planning;

-- Use the database
\c urban_planning;

-- Traffic segments table
CREATE TABLE IF NOT EXISTS traffic_segments (
    id VARCHAR(255) PRIMARY KEY,
    geom GEOMETRY(LINESTRING, 4326) NOT NULL,
    speed_kmph DECIMAL(10,2) NOT NULL,
    freeflow_kmph DECIMAL(10,2) NOT NULL,
    congestion_level DECIMAL(3,2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic incidents table
CREATE TABLE IF NOT EXISTS traffic_incidents (
    id VARCHAR(255) PRIMARY KEY,
    segment_id VARCHAR(255),
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    location GEOMETRY(POINT, 4326) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (segment_id) REFERENCES traffic_segments(id)
);

-- AQI stations table
CREATE TABLE IF NOT EXISTS aqi_stations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    aqi INTEGER NOT NULL,
    pm25 DECIMAL(10,2),
    pm10 DECIMAL(10,2),
    no2 DECIMAL(10,2),
    o3 DECIMAL(10,2),
    co DECIMAL(10,2),
    so2 DECIMAL(10,2),
    source VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AQI cells table
CREATE TABLE IF NOT EXISTS aqi_cells (
    id VARCHAR(255) PRIMARY KEY,
    geom GEOMETRY(POLYGON, 4326) NOT NULL,
    aqi INTEGER NOT NULL,
    pm25 DECIMAL(10,2),
    pm10 DECIMAL(10,2),
    no2 DECIMAL(10,2),
    o3 DECIMAL(10,2),
    co DECIMAL(10,2),
    so2 DECIMAL(10,2),
    source VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(255) PRIMARY KEY,
    zone_id VARCHAR(255) NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    aqi INTEGER NOT NULL,
    top_pollutant VARCHAR(50) NOT NULL,
    population_exposed INTEGER,
    location GEOMETRY(POINT, 4326) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulation results table
CREATE TABLE IF NOT EXISTS simulation_results (
    id VARCHAR(255) PRIMARY KEY,
    zone_id VARCHAR(255) NOT NULL,
    baseline_aqi INTEGER NOT NULL,
    baseline_pm25 DECIMAL(10,2),
    baseline_no2 DECIMAL(10,2),
    baseline_population_exposed INTEGER,
    predicted_aqi INTEGER NOT NULL,
    predicted_pm25 DECIMAL(10,2),
    predicted_no2 DECIMAL(10,2),
    predicted_population_exposed INTEGER,
    delta_aqi INTEGER NOT NULL,
    delta_pm25 DECIMAL(10,2),
    delta_no2 DECIMAL(10,2),
    population_benefiting INTEGER,
    confidence_band DECIMAL(3,2),
    interventions JSONB NOT NULL,
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_traffic_segments_geom ON traffic_segments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_traffic_segments_updated_at ON traffic_segments (updated_at);

CREATE INDEX IF NOT EXISTS idx_traffic_incidents_location ON traffic_incidents USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_segment_id ON traffic_incidents (segment_id);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_start_time ON traffic_incidents (start_time);

CREATE INDEX IF NOT EXISTS idx_aqi_stations_location ON aqi_stations USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_aqi_stations_updated_at ON aqi_stations (updated_at);

CREATE INDEX IF NOT EXISTS idx_aqi_cells_geom ON aqi_cells USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_aqi_cells_updated_at ON aqi_cells (updated_at);

CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_updated_at ON alerts (updated_at);

CREATE INDEX IF NOT EXISTS idx_simulation_results_zone_id ON simulation_results (zone_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_created_at ON simulation_results (created_at);

-- Insert sample data
INSERT INTO aqi_stations (id, name, location, aqi, pm25, pm10, no2, o3, source) VALUES
('station_001', 'Hyderabad Central', ST_GeomFromText('POINT(78.4867 17.3850)', 4326), 185, 85, 120, 45, 25, 'CPCB'),
('station_002', 'Secunderabad', ST_GeomFromText('POINT(78.4983 17.4399)', 4326), 220, 105, 150, 55, 30, 'CPCB'),
('station_003', 'HITEC City', ST_GeomFromText('POINT(78.3528 17.4474)', 4326), 195, 95, 135, 50, 28, 'CPCB')
ON CONFLICT (id) DO NOTHING;

INSERT INTO alerts (id, zone_id, zone_name, severity, aqi, top_pollutant, population_exposed, location) VALUES
('alert_001', 'zone_001', 'Central Business District', 'HIGH', 220, 'PM2.5', 12000, ST_GeomFromText('POINT(78.4867 17.3850)', 4326)),
('alert_002', 'zone_002', 'Industrial Area', 'HIGH', 235, 'PM10', 8500, ST_GeomFromText('POINT(78.4983 17.4399)', 4326)),
('alert_003', 'zone_003', 'Tech Corridor', 'MEDIUM', 180, 'NO2', 15000, ST_GeomFromText('POINT(78.3528 17.4474)', 4326))
ON CONFLICT (id) DO NOTHING;
