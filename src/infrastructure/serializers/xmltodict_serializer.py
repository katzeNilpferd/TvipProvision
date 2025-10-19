import xmltodict

from domain.entities.provision_config import ProvisionConfig
from domain.services.xml_serializer import XmlSerializer


class XmlToDictSerializer(XmlSerializer):

    def serialize(self, config: ProvisionConfig) -> str:
        config_dict = config.config_data.data

        if not config.config_data.validate_structure():
            raise ValueError('The root element <provision> must be in a single instance.')

        return xmltodict.unparse(
            config_dict,
            pretty=True,
            short_empty_elements=True
        )
