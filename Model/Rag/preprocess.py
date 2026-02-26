import pandas as pd

def load_csv(path="data/network_logs.csv"):
    return pd.read_csv(path)


def row_to_text(row):
    return f"""
    Network Flow Report:
    Destination Port: {row['Destination Port']}
    Flow Duration: {row['Flow Duration']}
    Total Forward Packets: {row['Total Fwd Packets']}
    Total Length of Forward Packets: {row['Total Length of Fwd Packets']}
    Flow Bytes per second: {row['Flow Bytes/s']}
    Flow Packets per second: {row['Flow Packets/s']}
    Attack Type: {row['Attack Type']}
    """


def convert_to_documents(df):
    return df.apply(row_to_text, axis=1).tolist()
