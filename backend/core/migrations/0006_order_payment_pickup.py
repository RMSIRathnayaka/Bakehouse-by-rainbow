from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_checkout_contact_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('online', 'Online Payment'),
                    ('cod', 'Cash on Delivery'),
                    ('pickup', 'Pickup'),
                ],
                max_length=10,
            ),
        ),
    ]
